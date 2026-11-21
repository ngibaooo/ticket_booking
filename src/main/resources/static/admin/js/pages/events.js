import { listEvents, listVenues, saveEvent } from "../api.js";
import { escapeHtml, formatDate, formatMoney, notify, renderEmptyState, renderPageHeading } from "../ui.js";

const eventStatusLabels = {
  DRAFT: "Nháp",
  UPCOMING: "Sắp mở bán",
  OPEN: "Đang bán",
  ON_SALE: "Đang bán",
  CLOSED: "Đã kết thúc",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy"
};

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function eventForm(event, venues) {
  const isEdit = Boolean(event);
  const prices = event?.pricesByTier || { VIP: 1200000, STANDARD: 750000 };
  return `<form class="adm-modal-form adm-event-form" id="adm-event-form" novalidate>
    <div class="adm-modal-heading"><div><span class="adm-modal-kicker">SỰ KIỆN</span><h2>${isEdit ? "Cập nhật sự kiện" : "Tạo sự kiện"}</h2></div>
      <button class="adm-button adm-button-quiet" type="button" data-adm-modal-close aria-label="Đóng hộp thoại">Đóng</button>
    </div>
    <div class="adm-modal-body">
      <div class="adm-field"><label for="adm-event-name">Tên sự kiện</label>
        <input id="adm-event-name" name="name" maxlength="160" value="${escapeHtml(event?.name || "")}" aria-describedby="adm-event-error">
      </div>
      <div class="adm-form-grid">
        <div class="adm-field"><label for="adm-event-venue">Địa điểm</label>
          <select id="adm-event-venue" name="venueId">
            ${venues.map(venue => `<option value="${escapeHtml(venue.id)}"${event?.venueId === venue.id ? " selected" : ""}>${escapeHtml(venue.name)}</option>`).join("")}
          </select>
        </div>
        <div class="adm-field"><label for="adm-event-status">Trạng thái</label>
          <select id="adm-event-status" name="status">
            ${Object.entries(eventStatusLabels).map(([value, label]) => `<option value="${value}"${event?.status === value ? " selected" : ""}>${label}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="adm-form-grid">
        <div class="adm-field"><label for="adm-event-starts">Bắt đầu diễn ra</label><input id="adm-event-starts" name="startsAt" type="datetime-local" value="${toInputDateTime(event?.startsAt)}"></div>
        <div class="adm-field"><label for="adm-event-ends">Kết thúc diễn ra</label><input id="adm-event-ends" name="endsAt" type="datetime-local" value="${toInputDateTime(event?.endsAt)}"></div>
        <div class="adm-field"><label for="adm-event-sale-start">Mở bán vé</label><input id="adm-event-sale-start" name="saleStartsAt" type="datetime-local" value="${toInputDateTime(event?.saleStartsAt)}"></div>
        <div class="adm-field"><label for="adm-event-sale-end">Kết thúc bán vé</label><input id="adm-event-sale-end" name="saleEndsAt" type="datetime-local" value="${toInputDateTime(event?.saleEndsAt)}"></div>
      </div>
      <fieldset class="adm-tier-fieldset"><legend>Giá theo hạng</legend>
        <div class="adm-form-grid">
          ${[["VIP", "VIP"], ["STANDARD", "Thường"]].map(([tier, label]) => `<div class="adm-field"><label for="adm-event-price-${tier.toLowerCase()}">${label} (VND)</label>
            <input id="adm-event-price-${tier.toLowerCase()}" name="price-${tier}" type="number" min="1" step="1000" value="${Number(prices[tier]) || 0}">
          </div>`).join("")}
        </div>
      </fieldset>
      <p class="adm-form-error" id="adm-event-error" aria-live="polite"></p>
    </div>
    <div class="adm-modal-footer">
      <button class="adm-button" type="button" data-adm-modal-close>Hủy</button>
      <button class="adm-button adm-button-primary" type="submit">${isEdit ? "Lưu thay đổi" : "Tạo sự kiện"}</button>
    </div>
  </form>`;
}

function openEventModal(event, venues, refresh) {
  if (!venues.length) {
    notify("Chưa có địa điểm. Thêm địa điểm trước khi tạo sự kiện.", "error");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "adm-modal-backdrop";
  modal.innerHTML = `<section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-event-name">${eventForm(event, venues)}</section>`;
  document.body.append(modal);

  const form = modal.querySelector("#adm-event-form");
  const nameInput = modal.querySelector("#adm-event-name");
  const error = modal.querySelector("#adm-event-error");

  modal.querySelectorAll("[data-adm-modal-close]").forEach(button => {
    button.addEventListener("click", () => modal.remove());
  });
  modal.addEventListener("click", clickEvent => {
    if (clickEvent.target === modal) modal.remove();
  });
  nameInput.focus();

  form.addEventListener("submit", async submitEvent => {
    submitEvent.preventDefault();
    error.textContent = "";

    const name = nameInput.value.trim();
    const startsAt = modal.querySelector("#adm-event-starts").value;
    const endsAt = modal.querySelector("#adm-event-ends").value;
    const saleStartsAt = modal.querySelector("#adm-event-sale-start").value;
    const saleEndsAt = modal.querySelector("#adm-event-sale-end").value;

    if (!name) {
      nameInput.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập tên sự kiện.";
      nameInput.focus();
      return;
    }

    if (!startsAt || !endsAt || !saleStartsAt || !saleEndsAt) {
      error.textContent = "Nhập đầy đủ thời gian bắt đầu, kết thúc, mở bán và kết thúc bán.";
      return;
    }

    if (new Date(saleEndsAt) <= new Date(saleStartsAt)) {
      error.textContent = "Thời gian kết thúc bán vé phải sau thời gian mở bán.";
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      error.textContent = "Thời gian kết thúc diễn ra phải sau thời gian bắt đầu.";
      return;
    }

    if (new Date(startsAt) <= new Date(saleEndsAt)) {
      error.textContent = "Thời gian kết thúc bán vé phải trước thời gian bắt đầu diễn ra.";
      return;
    }

    const pricesByTier = {
      VIP: Number(modal.querySelector("#adm-event-price-vip").value),
      STANDARD: Number(modal.querySelector("#adm-event-price-standard").value)
    };

    if (Object.values(pricesByTier).some(price => !Number.isFinite(price) || price <= 0)) {
      error.textContent = "Giá Standard và VIP phải lớn hơn 0.";
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
      await saveEvent({
        id: event?.id,
        name,
        venueId: modal.querySelector("#adm-event-venue").value,
        startsAt,
        endsAt,
        saleStartsAt,
        saleEndsAt,
        status: modal.querySelector("#adm-event-status").value,
        pricesByTier,
        capacity: event?.capacity || 0
      });
      modal.remove();
      notify(event ? "Đã cập nhật sự kiện." : "Đã tạo sự kiện.");
      await refresh();
    } catch (reason) {
      error.textContent = reason.message || "Không thể lưu sự kiện.";
    } finally {
      submit.disabled = false;
    }
  });
}

async function mountEvents(container) {
  let events;
  let venues;
  try {
    [events, venues] = await Promise.all([listEvents(), listVenues()]);
  } catch (reason) {
    container.innerHTML = `${renderPageHeading("Sự kiện", "Quản lý chương trình và lịch bán vé")}
      ${renderEmptyState("Không tải được danh sách", reason.message || "Thử tải lại trang.")}`;
    return;
  }

  container.innerHTML = `${renderPageHeading("Sự kiện", "Quản lý chương trình, thời gian và giá vé", `<button class="adm-button adm-button-primary" type="button" data-adm-add-event>Tạo sự kiện</button>`)}
    ${events.length ? `<div class="adm-table-frame"><table class="adm-table adm-event-table">
      <thead><tr><th>Sự kiện</th><th>Địa điểm</th><th>Diễn ra</th><th>Bán vé</th><th>Giá từ</th><th>Trạng thái</th><th><span class="adm-visually-hidden">Thao tác</span></th></tr></thead>
      <tbody>${events.map(event => {
        const venue = venues.find(item => item.id === event.venueId);
        const lowestPrice = event.pricesByTier ? Math.min(...Object.values(event.pricesByTier).map(Number).filter(Number.isFinite)) : 0;
        return `<tr>
          <td><strong>${escapeHtml(event.name)}</strong><span class="adm-table-code">${escapeHtml(event.id)}</span></td>
          <td>${escapeHtml(venue?.name || "Chưa gán địa điểm")}</td>
          <td>${formatDate(event.startsAt)}</td>
          <td><span>${formatDate(event.saleStartsAt)}</span><small class="adm-table-subtext">đến ${formatDate(event.saleEndsAt)}</small></td>
          <td class="adm-mono">${formatMoney(Number.isFinite(lowestPrice) ? lowestPrice : 0)}</td>
          <td><span class="adm-status adm-status-${event.status.toLowerCase()}">${eventStatusLabels[event.status] || event.status}</span></td>
          <td><div class="adm-row-actions">
            <button class="adm-button adm-button-quiet" type="button" data-adm-edit-event="${escapeHtml(event.id)}">Sửa</button>
          </div></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>` : renderEmptyState("Chưa có sự kiện", "Tạo sự kiện đầu tiên để mở lịch tổ chức và bán vé.")}`;

  container.querySelector("[data-adm-add-event]")?.addEventListener("click", () => openEventModal(null, venues, () => mountEvents(container)));
  container.querySelectorAll("[data-adm-edit-event]").forEach(button => {
    button.addEventListener("click", () => {
      const event = events.find(item => item.id === button.dataset.admEditEvent);
      openEventModal(event, venues, () => mountEvents(container));
    });
  });
}

export async function renderEvents() {
  const holder = document.createElement("div");
  await mountEvents(holder);
  return holder.innerHTML;
}

export function initEvents(root) {
  const container = root.querySelector(".adm-page");
  if (container) mountEvents(container);
}