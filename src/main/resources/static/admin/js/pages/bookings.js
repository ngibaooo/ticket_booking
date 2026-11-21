import { listBookings, listEvents, setBookingStatus } from "../api.js";
import { escapeHtml, formatDate, formatMoney, notify, renderEmptyState, renderPageHeading } from "../ui.js";

const bookingStatusLabels = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy"
};

async function mountBookings(container) {
  const queryInput = container.querySelector("#adm-booking-search")?.value || "";
  const statusSelect = container.querySelector("#adm-booking-status")?.value || "ALL";

  let bookings;
  let events;
  try {
    [bookings, events] = await Promise.all([
      listBookings({ query: queryInput, status: statusSelect }),
      listEvents()
    ]);
  } catch (reason) {
    container.innerHTML = `${renderPageHeading("Đặt vé", "Theo dõi và xử lý đơn đặt vé")}
      ${renderEmptyState("Không tải được danh sách", reason.message || "Thử tải lại trang.")}`;
    return;
  }

  container.innerHTML = `${renderPageHeading("Đặt vé", "Tìm kiếm, xác nhận hoặc hủy đơn")}
    <div class="adm-booking-toolbar" aria-label="Bộ lọc đơn đặt vé">
      <div class="adm-search-field">
        <label for="adm-booking-search">Tìm đơn đặt vé</label>
        <input id="adm-booking-search" type="search" value="${escapeHtml(queryInput)}" placeholder="Mã đơn, khách hàng hoặc ghế">
      </div>
      <div class="adm-field"><label for="adm-booking-status">Trạng thái</label>
        <select id="adm-booking-status">
          ${[["ALL", "Tất cả"], ["PENDING", "Chờ xử lý"], ["CONFIRMED", "Đã xác nhận"], ["CANCELLED", "Đã hủy"]]
            .map(([value, label]) => `<option value="${value}"${statusSelect === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <button class="adm-button" type="button" data-adm-clear-booking-filter>Đặt lại bộ lọc</button>
    </div>
    ${bookings.length ? `<div class="adm-table-frame"><table class="adm-table adm-booking-table">
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sự kiện</th><th>Ghế</th><th>Tổng tiền</th><th>Trạng thái</th><th><span class="adm-visually-hidden">Thao tác</span></th></tr></thead>
      <tbody>${bookings.map(booking => {
        const event = events.find(item => item.id === booking.eventId);
        return `<tr>
          <td><strong class="adm-mono">${escapeHtml(booking.id)}</strong><small class="adm-table-subtext">${formatDate(booking.createdAt)}</small></td>
          <td><strong>${escapeHtml(booking.customerName)}</strong></td>
          <td>${escapeHtml(event?.name || booking.eventId)}</td>
          <td><span class="adm-seat-labels">${booking.seatLabels.map(label => `<span class="adm-mono">${escapeHtml(label)}</span>`).join("")}</span></td>
          <td class="adm-mono">${formatMoney(booking.total)}</td>
          <td><span class="adm-status adm-status-${booking.status.toLowerCase()}">${bookingStatusLabels[booking.status] || booking.status}</span></td>
          <td><div class="adm-row-actions">
            ${booking.status === "PENDING" ? "<button class=\"adm-button adm-button-confirm\" type=\"button\" data-adm-confirm-booking=\"" + escapeHtml(booking.id) + "\">Xác nhận</button> <button class=\"adm-button adm-button-danger\" type=\"button\" data-adm-cancel-booking=\"" + escapeHtml(booking.id) + "\" data-adm-customer-name=\"" + escapeHtml(booking.customerName) + "\">Hủy đơn</button>" : "<span class=\"adm-table-subtext\">Không có thao tác</span>"}
          </div></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>` : renderEmptyState("Không có đơn phù hợp", "Thử bỏ từ khóa hoặc chọn một trạng thái khác.")}`;

  const searchInput = container.querySelector("#adm-booking-search");
  const statusInput = container.querySelector("#adm-booking-status");
  let searchTimer;

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => mountBookings(container), 180);
  });
  statusInput.addEventListener("change", () => mountBookings(container));
  container.querySelector("[data-adm-clear-booking-filter]").addEventListener("click", () => {
    searchInput.value = "";
    statusInput.value = "ALL";
    mountBookings(container);
  });

  container.querySelectorAll("[data-adm-confirm-booking]").forEach(button => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await setBookingStatus(button.dataset.admConfirmBooking, "CONFIRMED");
        notify("Đã xác nhận đơn đặt vé.");
        await mountBookings(container);
      } catch (reason) {
        notify(reason.message || "Không thể xác nhận đơn.", "error");
        button.disabled = false;
      }
    });
  });

  container.querySelectorAll("[data-adm-cancel-booking]").forEach(button => {
    button.addEventListener("click", async () => {
      const customerName = button.dataset.admCustomerName;
      if (!window.confirm(`Hủy đơn đặt vé của ${customerName}? Ghế đang giữ sẽ được mở lại.`)) return;
      button.disabled = true;
      try {
        await setBookingStatus(button.dataset.admCancelBooking, "CANCELLED");
        notify("Đã hủy đơn đặt vé.");
        await mountBookings(container);
      } catch (reason) {
        notify(reason.message || "Không thể hủy đơn.", "error");
        button.disabled = false;
      }
    });
  });
}

export async function renderBookings() {
  const holder = document.createElement("div");
  await mountBookings(holder);
  return holder.innerHTML;
}

export function initBookings(root) {
  const container = root.querySelector(".adm-page");
  if (container) mountBookings(container);
}