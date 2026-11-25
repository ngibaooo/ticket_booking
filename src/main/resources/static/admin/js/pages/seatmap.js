import { getSeatMap, listVenues, saveSeatMap } from "../api.js";
import { escapeHtml, notify, renderEmptyState, renderPageHeading } from "../ui.js";

const tierNames = { VIP: "VIP", STANDARD: "Thường" };

function normalizePhysicalSeats(payload) {
  const source = payload?.data?.seats ? payload.data : payload;
  const seats = Array.isArray(source) ? source : (Array.isArray(source?.seats) ? source.seats : []);
  return seats.map(seat => ({
    seatId: seat.seatId ?? seat.id ?? null,
    seatNumber: seat.seatNumber,
    rowName: seat.rowName,
    seatType: seat.seatType,
    positionX: Number(seat.positionX),
    positionY: Number(seat.positionY),
    isActive: seat.isActive !== false
  }));
}

function seatsByRow(seats) {
  const groups = new Map();
  seats.forEach(seat => {
    if (!groups.has(seat.rowName)) groups.set(seat.rowName, []);
    groups.get(seat.rowName).push(seat);
  });
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([rowName, rowSeats]) => [
    rowName,
    rowSeats.sort((a, b) => a.positionX - b.positionX)
  ]);
}

function renderSeatGrid(seats) {
  return seatsByRow(seats).map(([rowName, rowSeats]) => `<div class="adm-seat-row">
    <strong class="adm-seat-row-label">${escapeHtml(rowName)}</strong>
    <div class="adm-seat-line">${rowSeats.map(seat => `<button class="adm-seat adm-seat-${String(seat.seatType).toLowerCase()}${seat.isActive ? "" : " adm-seat-lock"}" type="button" data-adm-seat-id="${escapeHtml(seat.seatId ?? "")}" data-adm-seat-number="${escapeHtml(seat.seatNumber)}" data-adm-row-name="${escapeHtml(seat.rowName)}" data-adm-position-x="${seat.positionX}" data-adm-position-y="${seat.positionY}" aria-pressed="${seat.isActive ? "false" : "true"}" title="${escapeHtml(seat.seatNumber)} tại (${seat.positionX}, ${seat.positionY})">
      <span>${escapeHtml(seat.seatNumber)}</span><small>${seat.isActive ? (tierNames[seat.seatType] || seat.seatType) : "Khoá"}</small>
    </button>`).join("")}</div>
    <label class="adm-row-tier"><span>Hạng hàng ${escapeHtml(rowName)}</span>
      <select data-adm-row-type="${escapeHtml(rowName)}" aria-label="Hạng ghế hàng ${escapeHtml(rowName)}">
        ${["VIP", "STANDARD"].map(type => `<option value="${type}"${rowSeats.every(seat => seat.seatType === type) ? " selected" : ""}>${tierNames[type]}</option>`).join("")}
      </select>
    </label>
  </div>`).join("");
}

export async function renderSeatMap() {
  const venues = await listVenues();
  if (!venues.length) {
    return `${renderPageHeading("Sơ đồ ghế", "Ghế vật lý theo seatNumber, rowName và tọa độ")}
      ${renderEmptyState("Chưa có địa điểm", "Thêm địa điểm trước, sau đó quay lại thiết lập ghế.")}`;
  }

  const seatResponse = await getSeatMap(venues[0].id);
  const seats = normalizePhysicalSeats(seatResponse);

  return `<div data-adm-seatmap-page>
    ${renderPageHeading("Sơ đồ ghế", "Ghế vật lý, hạng ghế và trạng thái hoạt động", `<button class="adm-button adm-button-primary" type="button" data-adm-save-seats>Lưu ghế</button>`)}
    <div class="adm-seatmap-toolbar">
      <div class="adm-field"><label for="adm-seatmap-venue">Địa điểm</label>
        <select id="adm-seatmap-venue">${venues.map(venue => `<option value="${escapeHtml(venue.id)}">${escapeHtml(venue.venueName)}</option>`).join("")}</select>
      </div>
      <button class="adm-button" type="button" data-adm-add-seat>Thêm ghế</button>
    </div>
    <div class="adm-seatmap-layout">
      <section class="adm-seatmap-canvas" aria-label="Sơ đồ ghế vật lý">
        <div class="adm-stage" aria-hidden="true">Sân khấu</div>
        <div class="adm-seat-grid" data-adm-seat-grid>${renderSeatGrid(seats)}</div>
        <div class="adm-seat-legend"><span><i class="adm-seat-key adm-seat-key-vip"></i>VIP</span><span><i class="adm-seat-key adm-seat-key-standard"></i>Thường</span><span><i class="adm-seat-key adm-seat-key-lock"></i>Không hoạt động</span></div>
        <p class="adm-login-note">Thêm ghế mới gọi POST từng ghế một với seatNumber, rowName, seatType, positionX và positionY.</p>
      </section>
      <aside class="adm-seatmap-summary">
        <div><span>Tổng ghế</span><strong class="adm-mono" data-adm-seat-count>${seats.length}</strong></div>
        <div><span>Không hoạt động</span><strong class="adm-mono" data-adm-lock-count>${seats.filter(seat => !seat.isActive).length}</strong></div>
        <div><span>Đang hoạt động</span><strong class="adm-mono" data-adm-sale-count>${seats.filter(seat => seat.isActive).length}</strong></div>
      </aside>
    </div>
  </div>`;
}

export async function initSeatMap(root) {
  const page = root.querySelector("[data-adm-seatmap-page]");
  if (!page) return;

  const venueSelect = page.querySelector("#adm-seatmap-venue");
  const grid = page.querySelector("[data-adm-seat-grid]");

  const updateCounts = seats => {
    page.querySelector("[data-adm-seat-count]").textContent = String(seats.length);
    page.querySelector("[data-adm-lock-count]").textContent = String(seats.filter(seat => !seat.isActive).length);
    page.querySelector("[data-adm-sale-count]").textContent = String(seats.filter(seat => seat.isActive).length);
  };

  const getRenderedSeats = () => [...grid.querySelectorAll("[data-adm-seat-id]")].map(button => {
    const row = button.closest(".adm-seat-row");
    const seatNumber = button.dataset.admSeatNumber;
    return {
      seatId: button.dataset.admSeatId || null,
      seatNumber,
      rowName: button.dataset.admRowName,
      seatType: row.querySelector("[data-adm-row-type]").value,
      positionX: Number(button.dataset.admPositionX),
      positionY: Number(button.dataset.admPositionY),
      isActive: button.getAttribute("aria-pressed") !== "true"
    };
  });

  venueSelect.addEventListener("change", async () => {
    const seats = normalizePhysicalSeats(await getSeatMap(venueSelect.value));
    grid.innerHTML = renderSeatGrid(seats);
    updateCounts(seats);
  });

  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-adm-seat-id]");
    if (!button) return;
    const inactive = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(inactive));
    button.classList.toggle("adm-seat-lock", inactive);
    const rowType = button.closest(".adm-seat-row").querySelector("[data-adm-row-type]").value;
    button.querySelector("small").textContent = inactive ? "Khoá" : (tierNames[rowType] || rowType);
    updateCounts(getRenderedSeats());
  });

  page.addEventListener("change", event => {
    if (!event.target.matches("[data-adm-row-type]")) return;
    event.target.closest(".adm-seat-row").querySelectorAll("[data-adm-seat-id]").forEach(button => {
      button.classList.remove("adm-seat-vip", "adm-seat-standard");
      button.classList.add(`adm-seat-${event.target.value.toLowerCase()}`);
      if (button.getAttribute("aria-pressed") !== "true") button.querySelector("small").textContent = tierNames[event.target.value];
    });
  });

  page.querySelector("[data-adm-add-seat]").addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.className = "adm-modal-backdrop";
    modal.innerHTML = `<section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-seat-modal-title">
      <form class="adm-modal-form" data-adm-seat-form novalidate>
        <div class="adm-modal-heading"><div><span class="adm-modal-kicker">SƠ ĐỒ GHẾ</span><h2 id="adm-seat-modal-title">Thêm ghế</h2></div>
          <button class="adm-button adm-button-quiet" type="button" data-adm-seat-close aria-label="Đóng hộp thoại">Đóng</button>
        </div>
        <div class="adm-modal-body">
          <div class="adm-form-grid">
            <div class="adm-field"><label for="adm-seat-number">Mã ghế</label><input id="adm-seat-number" name="seatNumber" maxlength="10" required></div>
            <div class="adm-field"><label for="adm-seat-row">Hàng</label><input id="adm-seat-row" name="rowName" maxlength="10" required></div>
            <div class="adm-field"><label for="adm-seat-type">Hạng ghế</label><select id="adm-seat-type" name="seatType"><option value="STANDARD">Thường</option><option value="VIP">VIP</option></select></div>
            <div class="adm-field"><label for="adm-seat-x">Vị trí ngang</label><input id="adm-seat-x" name="positionX" type="number" min="0" step="1" required></div>
            <div class="adm-field"><label for="adm-seat-y">Vị trí dọc</label><input id="adm-seat-y" name="positionY" type="number" min="0" step="1" required></div>
          </div>
          <p class="adm-form-error" data-adm-seat-error aria-live="polite"></p>
        </div>
        <div class="adm-modal-footer"><button class="adm-button" type="button" data-adm-seat-close>Hủy</button><button class="adm-button adm-button-primary" type="submit">Thêm vào sơ đồ</button></div>
      </form>
    </section>`;
    document.body.append(modal);

    modal.querySelectorAll("[data-adm-seat-close]").forEach(button => button.addEventListener("click", () => modal.remove()));
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("[data-adm-seat-form]").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const seatNumber = String(formData.get("seatNumber")).trim();
      const rowName = String(formData.get("rowName")).trim();
      const positionX = Number(formData.get("positionX"));
      const positionY = Number(formData.get("positionY"));
      const existing = getRenderedSeats();
      const error = modal.querySelector("[data-adm-seat-error]");
      if (!seatNumber || !rowName || !Number.isInteger(positionX) || positionX < 0 || !Number.isInteger(positionY) || positionY < 0) {
        error.textContent = "Nhập mã ghế, hàng và tọa độ hợp lệ.";
        return;
      }
      if (existing.some(seat => seat.seatNumber.toLocaleLowerCase() === seatNumber.toLocaleLowerCase()
        || (seat.positionX === positionX && seat.positionY === positionY))) {
        error.textContent = "Mã ghế hoặc tọa độ đã được sử dụng.";
        return;
      }
      const newSeat = {
        seatId: null,
        seatNumber,
        rowName,
        seatType: String(formData.get("seatType")),
        positionX,
        positionY,
        isActive: true
      };
      grid.innerHTML = renderSeatGrid([...existing, newSeat]);
      updateCounts([...existing, newSeat]);
      modal.remove();
    });
  });

  page.querySelector("[data-adm-save-seats]").addEventListener("click", async () => {
    try {
      await saveSeatMap(venueSelect.value, { venueId: venueSelect.value, seats: getRenderedSeats() });
      const savedSeats = normalizePhysicalSeats(await getSeatMap(venueSelect.value));
      grid.innerHTML = renderSeatGrid(savedSeats);
      updateCounts(savedSeats);
      notify("Đã lưu thay đổi ghế vật lý.");
    } catch (reason) {
      notify(reason.message || "Không thể lưu ghế.", "error");
    }
  });
}