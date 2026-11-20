import { getDashboardData } from "../api.js";
import { escapeHtml, formatDate, formatMoney, renderEmptyState, renderPageHeading } from "../ui.js";

function statusLabel(status) {
  return {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy"
  }[status] || status;
}

export async function renderDashboard() {
  const data = await getDashboardData();

  if (!data.events.length && !data.recentBookings.length) {
    return `${renderPageHeading("Tổng quan", "Tình hình hoạt động bán vé")}
      ${renderEmptyState("Chưa có dữ liệu", "Tạo sự kiện và đơn đặt vé để bắt đầu theo dõi hoạt động.")}`;
  }

  const eventTotals = data.events.map(event => ({
    event,
    revenue: data.revenueByEvent.find(item => item.eventId === event.id)?.revenue || 0
  }));
  const maxEventRevenue = Math.max(...eventTotals.map(item => item.revenue), 1);

  return `${renderPageHeading("Tổng quan", "Tình hình hoạt động bán vé hôm nay")}
    <section class="adm-dashboard-summary" aria-label="Chỉ số tổng quan">
      <div class="adm-summary-item"><span>Doanh thu đã xác nhận</span><strong>${formatMoney(data.revenue)}</strong></div>
      <div class="adm-summary-item"><span>Vé đã bán</span><strong>${data.ticketsSold}</strong></div>
      <div class="adm-summary-item"><span>Sự kiện đang bán</span><strong>${data.eventsOnSale}</strong></div>
      <div class="adm-summary-item adm-summary-warning"><span>Đơn chờ xử lý</span><strong>${data.pendingBookings}</strong></div>
    </section>

    <div class="adm-dashboard-grid">
      <section class="adm-panel" aria-labelledby="adm-revenue-title">
        <div class="adm-panel-heading"><h2 id="adm-revenue-title">Doanh thu theo sự kiện</h2><span>Dữ liệu đơn gần đây</span></div>
        ${eventTotals.length ? `<div class="adm-revenue-bars">
          ${eventTotals.map(({ event, revenue }) => {
            const width = revenue ? Math.max(8, (revenue / maxEventRevenue) * 100) : 0;
            return `<div class="adm-revenue-row">
              <div class="adm-revenue-label"><strong>${escapeHtml(event.name)}</strong><span>${formatMoney(revenue)}</span></div>
              <div class="adm-revenue-track" aria-label="${escapeHtml(event.name)}: ${formatMoney(revenue)}">
                <span style="width:${width}%"></span>
              </div>
            </div>`;
          }).join("")}
        </div>` : renderEmptyState("Chưa có doanh thu", "Khi đơn được xác nhận, doanh thu sẽ hiện theo từng sự kiện.")}
      </section>

      <section class="adm-panel adm-recent-panel" aria-labelledby="adm-recent-title">
        <div class="adm-panel-heading"><h2 id="adm-recent-title">Đơn gần đây</h2><a class="adm-button adm-button-quiet" href="#/bookings">Xem tất cả</a></div>
        ${data.recentBookings.length ? `<div class="adm-recent-list">
          ${data.recentBookings.map(booking => `<article class="adm-recent-item">
            <div><strong class="adm-mono">${escapeHtml(booking.id)}</strong><span>${escapeHtml(booking.customerName)}</span></div>
            <div><strong>${formatMoney(booking.total)}</strong><span>${formatDate(booking.createdAt)}</span></div>
            <span class="adm-status adm-status-${booking.status.toLowerCase()}">${statusLabel(booking.status)}</span>
          </article>`).join("")}
        </div>` : renderEmptyState("Chưa có đơn", "Tạo đơn đặt vé để theo dõi tại đây.")}
      </section>
    </div>`;
}