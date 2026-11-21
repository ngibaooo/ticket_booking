import { getSeatMap, listVenues, saveSeatMap } from "../api.js";
import { escapeHtml, notify, renderEmptyState, renderPageHeading } from "../ui.js";

const tierNames = {
  VIP: "VIP",
  STANDARD: "Thường",
  ECONOMY: "Tiết kiệm"
};

function rowLabel(index) {
  return String.fromCharCode(65 + index);
}

function normalizeSeatMap(seatMap, rows, seatsPerRow) {
  const next = {
    rows,
    seatsPerRow,
    pricesByRow: {},
    lockedSeats: [...(seatMap?.lockedSeats || [])]
  };

  for (let index = 0; index < rows; index += 1) {
    const label = rowLabel(index);
    next.pricesByRow[label] = seatMap?.pricesByRow?.[label] || (index < 2 ? "VIP" : index < 5 ? "STANDARD" : "ECONOMY");
  }

  const validLabels = new Set();
  for (let row = 0; row < rows; row += 1) {
    for (let seat = 1; seat <= seatsPerRow; seat += 1) {
      validLabels.add(`${rowLabel(row)}${String(seat).padStart(2, "0")}`);
    }
  }
  next.lockedSeats = next.lockedSeats.filter(label => validLabels.has(label));
  return next;
}

function renderSeatGrid(seatMap) {
  const rows = [];
  for (let rowIndex = 0; rowIndex < seatMap.rows; rowIndex += 1) {
    const label = rowLabel(rowIndex);
    const seats = [];
    for (let seatIndex = 1; seatIndex <= seatMap.seatsPerRow; seatIndex += 1) {
      const seatLabel = `${label}${String(seatIndex).padStart(2, "0")}`;
      const locked = seatMap.lockedSeats.includes(seatLabel);
      seats.push(`<button class="adm-seat adm-seat-${seatMap.pricesByRow[label].toLowerCase()}${locked ? " adm-seat-lock" : ""}" type="button" data-adm-seat="${seatLabel}" aria-pressed="${locked}" title="${locked ? "Mở" : "Khóa"} ghế ${seatLabel}">
        <span>${seatLabel}</span><small>${locked ? "Khoá" : tierNames[seatMap.pricesByRow[label]]}</small>
      </button>`);
    }
    rows.push(`<div class="adm-seat-row"><strong class="adm-seat-row-label">${label}</strong><div class="adm-seat-line">${seats.join("")}</div>
      <label class="adm-row-tier"><span>Hạng hàng ${label}</span><select data-adm-row-tier="${label}" aria-label="Hạng giá hàng ${label}">
        ${["VIP", "STANDARD", "ECONOMY"].map(tier => `<option value="${tier}"${seatMap.pricesByRow[label] === tier ? " selected" : ""}>${tierNames[tier]}</option>`).join("")}
      </select></label>
    </div>`);
  }
  return rows.join("");
}

export async function renderSeatMap() {
  const venues = await listVenues();
  if (!venues.length) {
    return `${renderPageHeading("Sơ đồ ghế", "Chỉnh hàng ghế, hạng giá và ghế khóa")}
      ${renderEmptyState("Chưa có địa điểm", "Thêm địa điểm trước, sau đó quay lại để thiết lập sơ đồ ghế.")}`;
  }

  const selectedVenueId = venues.find(venue => venue.seatMap?.rows)?.id || venues[0].id;
  let venue = venues.find(item => item.id === selectedVenueId);
  let seatMap = await getSeatMap(selectedVenueId);
  seatMap = normalizeSeatMap(seatMap, Number(seatMap?.rows) || 8, Number(seatMap?.seatsPerRow) || 12);

  const heading = renderPageHeading("Sơ đồ ghế", "Chọn địa điểm và cấu hình bố trí ghế", `<button class="adm-button adm-button-primary" type="button" data-adm-save-seatmap>Lưu sơ đồ</button>`);
  const shell = `${heading}
    <div class="adm-seatmap-toolbar">
      <div class="adm-field"><label for="adm-seatmap-venue">Địa điểm</label>
        <select id="adm-seatmap-venue">${venues.map(item => `<option value="${escapeHtml(item.id)}"${item.id === selectedVenueId ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select>
      </div>
      <div class="adm-field"><label for="adm-seatmap-rows">Số hàng</label><input id="adm-seatmap-rows" type="number" min="1" max="26" value="${seatMap.rows}"></div>
      <div class="adm-field"><label for="adm-seatmap-seats">Ghế mỗi hàng</label><input id="adm-seatmap-seats" type="number" min="1" max="30" value="${seatMap.seatsPerRow}"></div>
      <button class="adm-button" type="button" data-adm-rebuild-seatmap>Tạo lại</button>
    </div>
    <div class="adm-seatmap-layout">
      <section class="adm-seatmap-canvas" aria-label="Sơ đồ ghế của ${escapeHtml(venue.name)}">
        <div class="adm-stage" aria-hidden="true">Sân khấu</div>
        <div class="adm-seat-grid" data-adm-seat-grid>${renderSeatGrid(seatMap)}</div>
        <div class="adm-seat-legend" aria-label="Chú thích ghế">
          <span><i class="adm-seat-key adm-seat-key-vip"></i>VIP</span>
          <span><i class="adm-seat-key adm-seat-key-standard"></i>Thường</span>
          <span><i class="adm-seat-key adm-seat-key-economy"></i>Tiết kiệm</span>
          <span><i class="adm-seat-key adm-seat-key-lock"></i>Đã khóa</span>
        </div>
      </section>
      <aside class="adm-seatmap-summary" aria-label="Tóm tắt sơ đồ">
        <div><span>Tổng ghế</span><strong class="adm-mono" data-adm-seat-count>0</strong></div>
        <div><span>Đang khóa</span><strong class="adm-mono" data-adm-lock-count>0</strong></div>
        <div><span>Có thể bán</span><strong class="adm-mono" data-adm-sale-count>0</strong></div>
      </aside>
    </div>`;

  return `<div data-adm-seatmap-page>${shell}</div>`;
}

export async function initSeatMap(root) {
  const page = root.querySelector("[data-adm-seatmap-page]");
  if (!page) return;

  const venueSelect = page.querySelector("#adm-seatmap-venue");
  const rowsInput = page.querySelector("#adm-seatmap-rows");
  const seatsInput = page.querySelector("#adm-seatmap-seats");
  const grid = page.querySelector("[data-adm-seat-grid]");

  const getCurrentMap = () => {
    const rows = Math.max(1, Math.min(26, Number(rowsInput.value) || 8));
    const seatsPerRow = Math.max(1, Math.min(30, Number(seatsInput.value) || 12));
    const lockedSeats = [...page.querySelectorAll("[data-adm-seat]")]
      .filter(button => button.getAttribute("aria-pressed") === "true")
      .map(button => button.dataset.admSeat);
    const pricesByRow = {};
    page.querySelectorAll("[data-adm-row-tier]").forEach(select => {
      pricesByRow[select.dataset.admRowTier] = select.value;
    });
    return normalizeSeatMap({ pricesByRow, lockedSeats }, rows, seatsPerRow);
  };

  const updateCounts = seatMap => {
    const total = seatMap.rows * seatMap.seatsPerRow;
    page.querySelector("[data-adm-seat-count]").textContent = String(total);
    page.querySelector("[data-adm-lock-count]").textContent = String(seatMap.lockedSeats.length);
    page.querySelector("[data-adm-sale-count]").textContent = String(total - seatMap.lockedSeats.length);
  };

  const refreshGrid = seatMap => {
    grid.innerHTML = renderSeatGrid(seatMap);
    updateCounts(seatMap);
  };

  const loadVenue = async () => {
    const seatMap = await getSeatMap(venueSelect.value);
    const normalized = normalizeSeatMap(seatMap, Number(seatMap?.rows) || 8, Number(seatMap?.seatsPerRow) || 12);
    rowsInput.value = String(normalized.rows);
    seatsInput.value = String(normalized.seatsPerRow);
    refreshGrid(normalized);
  };

  page.querySelector("[data-adm-rebuild-seatmap]").addEventListener("click", () => {
    const rows = Math.max(1, Math.min(26, Number(rowsInput.value) || 8));
    const seats = Math.max(1, Math.min(30, Number(seatsInput.value) || 12));
    refreshGrid(normalizeSeatMap(getCurrentMap(), rows, seats));
  });

  venueSelect.addEventListener("change", () => {
    loadVenue().catch(reason => notify(reason.message || "Không tải được sơ đồ ghế.", "error"));
  });

  grid.addEventListener("click", event => {
    const seatButton = event.target.closest("[data-adm-seat]");
    if (!seatButton) return;

    const locked = seatButton.getAttribute("aria-pressed") !== "true";
    seatButton.setAttribute("aria-pressed", String(locked));
    seatButton.classList.toggle("adm-seat-lock", locked);

    const seatMap = getCurrentMap();
    const rowLabelValue = seatButton.dataset.admSeat.charAt(0);
    const small = seatButton.querySelector("small");
    small.textContent = locked ? "Khoá" : tierNames[seatMap.pricesByRow[rowLabelValue]];
    updateCounts(seatMap);
  });

  page.addEventListener("change", event => {
    if (!event.target.matches("[data-adm-row-tier]")) return;
    refreshGrid(getCurrentMap());
  });

  page.querySelector("[data-adm-save-seatmap]").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await saveSeatMap(venueSelect.value, getCurrentMap());
      notify("Đã lưu sơ đồ ghế.");
    } catch (reason) {
      notify(reason.message || "Không thể lưu sơ đồ ghế.", "error");
    } finally {
      button.disabled = false;
    }
  });

  updateCounts(getCurrentMap());
}