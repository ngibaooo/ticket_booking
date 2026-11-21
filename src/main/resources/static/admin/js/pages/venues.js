import { deleteVenue, listVenues, saveVenue } from "../api.js";
import { escapeHtml, notify, renderEmptyState, renderPageHeading } from "../ui.js";

function venueStatus(status) {
  return status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động";
}

function venueForm(venue = null) {
  const isEdit = Boolean(venue);
  return `<form class="adm-modal-form" id="adm-venue-form" novalidate>
    <div class="adm-modal-heading"><div><span class="adm-modal-kicker">ĐỊA ĐIỂM</span><h2>${isEdit ? "Cập nhật địa điểm" : "Thêm địa điểm"}</h2></div>
      <button class="adm-button adm-button-quiet" type="button" data-adm-modal-close aria-label="Đóng hộp thoại">Đóng</button>
    </div>
    <div class="adm-modal-body">
      <div class="adm-field"><label for="adm-venue-name">Tên địa điểm</label>
        <input id="adm-venue-name" name="name" maxlength="120" value="${escapeHtml(venue?.name || "")}" aria-describedby="adm-venue-error">
      </div>
      <div class="adm-field"><label for="adm-venue-address">Địa chỉ</label>
        <textarea id="adm-venue-address" name="address" rows="3" maxlength="240" aria-describedby="adm-venue-error">${escapeHtml(venue?.address || "")}</textarea>
      </div>
      <div class="adm-field"><label for="adm-venue-status">Trạng thái</label>
        <select id="adm-venue-status" name="status">
          <option value="ACTIVE"${venue?.status !== "INACTIVE" ? " selected" : ""}>Đang hoạt động</option>
          <option value="INACTIVE"${venue?.status === "INACTIVE" ? " selected" : ""}>Ngưng hoạt động</option>
        </select>
      </div>
      <p class="adm-form-error" id="adm-venue-error" aria-live="polite"></p>
    </div>
    <div class="adm-modal-footer">
      <button class="adm-button" type="button" data-adm-modal-close>Hủy</button>
      <button class="adm-button adm-button-primary" type="submit">${isEdit ? "Lưu thay đổi" : "Thêm địa điểm"}</button>
    </div>
  </form>`;
}

function openVenueModal(venue = null) {
  const modal = document.createElement("div");
  modal.className = "adm-modal-backdrop";
  modal.innerHTML = `<section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-venue-name">${venueForm(venue)}</section>`;
  document.body.append(modal);

  const form = modal.querySelector("#adm-venue-form");
  const nameInput = modal.querySelector("#adm-venue-name");
  const addressInput = modal.querySelector("#adm-venue-address");
  const error = modal.querySelector("#adm-venue-error");
  const closeButtons = modal.querySelectorAll("[data-adm-modal-close]");

  closeButtons.forEach(button => button.addEventListener("click", () => modal.remove()));
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });
  nameInput.focus();

  form.onsubmit = async event => {
    event.preventDefault();
    error.textContent = "";
    nameInput.removeAttribute("aria-invalid");
    addressInput.removeAttribute("aria-invalid");

    const name = nameInput.value.trim();
    const address = addressInput.value.trim();

    if (!name) {
      nameInput.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập tên địa điểm.";
      nameInput.focus();
      return;
    }

    if (!address) {
      addressInput.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập địa chỉ tổ chức.";
      addressInput.focus();
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
      await saveVenue({
        id: venue?.id,
        name,
        address,
        status: modal.querySelector("#adm-venue-status").value,
        seatMap: venue?.seatMap || { rows: 0, seatsPerRow: 0, pricesByRow: {}, lockedSeats: [] }
      });
      modal.remove();
      notify(venue ? "Đã cập nhật địa điểm." : "Đã thêm địa điểm.");
      const page = document.querySelector(".adm-page");
      if (page) mountVenuePage(page);
    } catch (reason) {
      error.textContent = reason.message || "Không thể lưu địa điểm.";
    } finally {
      submit.disabled = false;
    }
  };
}

async function mountVenuePage(container) {
  let venues;
  try {
    venues = await listVenues();
  } catch (reason) {
    container.innerHTML = `${renderPageHeading("Địa điểm", "Quản lý địa điểm tổ chức")}
      ${renderEmptyState("Không tải được danh sách", reason.message || "Thử tải lại trang.")}`;
    return;
  }

  container.innerHTML = `${renderPageHeading("Địa điểm", "Quản lý nơi tổ chức sự kiện", `<button class="adm-button adm-button-primary" type="button" data-adm-add-venue>Thêm địa điểm</button>`)}
    ${venues.length ? `<div class="adm-table-frame">
      <table class="adm-table">
        <thead><tr><th>Tên địa điểm</th><th>Địa chỉ</th><th>Trạng thái</th><th>Số ghế</th><th><span class="adm-visually-hidden">Thao tác</span></th></tr></thead>
        <tbody>${venues.map(venue => {
          const seatMap = venue.seatMap || {};
          const seats = (Number(seatMap.rows) || 0) * (Number(seatMap.seatsPerRow) || 0);
          return `<tr>
            <td><strong>${escapeHtml(venue.name)}</strong><span class="adm-table-code">${escapeHtml(venue.id)}</span></td>
            <td>${escapeHtml(venue.address)}</td>
            <td><span class="adm-status adm-status-${venue.status.toLowerCase()}">${venueStatus(venue.status)}</span></td>
            <td class="adm-mono">${seats}</td>
            <td><div class="adm-row-actions">
              <button class="adm-button adm-button-quiet" type="button" data-adm-edit-venue="${escapeHtml(venue.id)}">Sửa</button>
              <button class="adm-button adm-button-danger" type="button" data-adm-delete-venue="${escapeHtml(venue.id)}" data-adm-venue-name="${escapeHtml(venue.name)}">Xóa</button>
            </div></td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </div>` : renderEmptyState("Chưa có địa điểm", "Thêm địa điểm đầu tiên để bắt đầu bố trí sơ đồ ghế.")}`;

  container.querySelector("[data-adm-add-venue]")?.addEventListener("click", () => openVenueModal());

  container.querySelectorAll("[data-adm-edit-venue]").forEach(button => {
    button.addEventListener("click", () => {
      openVenueModal(venues.find(venue => venue.id === button.dataset.admEditVenue));
    });
  });

  container.querySelectorAll("[data-adm-delete-venue]").forEach(button => {
    button.addEventListener("click", async () => {
      const name = button.dataset.admVenueName;
      if (!window.confirm(`Xóa địa điểm “${name}”? Thao tác này không thể hoàn tác.`)) return;
      try {
        await deleteVenue(button.dataset.admDeleteVenue);
        notify("Đã xóa địa điểm.");
        mountVenuePage(container);
      } catch (reason) {
        notify(reason.message || "Không thể xóa địa điểm.", "error");
      }
    });
  });
}

export async function renderVenues() {
  const holder = document.createElement("div");
  await mountVenuePage(holder);
  return holder.innerHTML;
}