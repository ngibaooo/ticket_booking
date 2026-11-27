import { listVenues, saveVenue } from "../api.js";
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
        <input id="adm-venue-name" name="venueName" maxlength="150" value="${escapeHtml(venue?.venueName || "")}" aria-describedby="adm-venue-error">
      </div>
      <div class="adm-field"><label for="adm-venue-address">Địa chỉ</label>
        <textarea id="adm-venue-address" name="address" rows="2" maxlength="240" aria-describedby="adm-venue-error">${escapeHtml(venue?.address || "")}</textarea>
      </div>
      <div class="adm-field"><label for="adm-venue-description">Mô tả</label>
        <textarea id="adm-venue-description" name="description" rows="3" maxlength="500">${escapeHtml(venue?.description || "")}</textarea>
      </div>
      <div class="adm-field"><label for="adm-venue-capacity">Sức chứa</label>
        <input id="adm-venue-capacity" name="capacity" type="number" min="1" step="1" value="${Number(venue?.capacity) || 1}">
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
    const description = modal.querySelector("#adm-venue-description").value.trim();
    const capacity = Number(modal.querySelector("#adm-venue-capacity").value);

    if (!name) {
      nameInput.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập tên địa điểm.";
      nameInput.focus();
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      error.textContent = "Sức chứa phải là số nguyên lớn hơn 0.";
      modal.querySelector("#adm-venue-capacity").focus();
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
        venueName: name,
        address,
        description,
        capacity,
        status: venue?.status || "ACTIVE",
        seats: venue?.seats || []
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
        <thead><tr><th>Tên địa điểm</th><th>Địa chỉ</th><th>Mô tả</th><th>Sức chứa</th><th>Trạng thái</th><th><span class="adm-visually-hidden">Thao tác</span></th></tr></thead>
        <tbody>${venues.map(venue => {
          return `<tr>
            <td><strong>${escapeHtml(venue.venueName)}</strong><span class="adm-table-code">${escapeHtml(venue.id)}</span></td>
            <td>${escapeHtml(venue.address)}</td>
            <td>${escapeHtml(venue.description || "")}</td>
            <td class="adm-mono">${Number(venue.capacity) || 0}</td>
            <td><span class="adm-status adm-status-${venue.status.toLowerCase()}">${venueStatus(venue.status)}</span></td>
            <td><div class="adm-row-actions">
              <button class="adm-button adm-button-quiet" type="button" data-adm-edit-venue="${escapeHtml(venue.id)}">Sửa</button>
              <a class="adm-button" href="#/seatmap">Sơ đồ ghế</a>
            </div></td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </div>` : renderEmptyState("Chưa có địa điểm", "Thêm địa điểm đầu tiên để bắt đầu bố trí sơ đồ ghế.")}`;

  container.querySelector("[data-adm-add-venue]")?.addEventListener("click", () => openVenueModal());

  container.querySelectorAll("[data-adm-edit-venue]").forEach(button => {
    button.addEventListener("click", () => {
      const venue = venues.find(item => String(item.id) === button.dataset.admEditVenue);
      if (venue) openVenueModal(venue);
    });
  });

}

export async function renderVenues() {
  const holder = document.createElement("div");
  await mountVenuePage(holder);
  return holder.innerHTML;
}

export function initVenues(root) {
  const container = root.querySelector(".adm-page");
  if (container) mountVenuePage(container);
}