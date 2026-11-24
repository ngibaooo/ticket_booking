import { api, getMode, getSession } from "../api.js";
import { icons } from "../icons.js";
import { renderQrSvg } from "../qr.js";
import {
  bookingStatusMeta,
  escapeHtml,
  formatDateTime,
  formatMoney,
  openModal,
  showNotice,
  ticketStatusMeta
} from "../ui.js";

export function renderTicketsPage(container, ctx, queryParams) {
  let destroyed = false;
  const highlightBookingId = queryParams?.get("new") || "";

  async function load() {
    const session = getSession();
    if (!session) {
      container.innerHTML = `
        <section class="vn-state-box">
          <h2>Đăng nhập để xem vé điện tử của bạn</h2>
          <p>Tất cả đơn đặt vé và mã QR vào cổng được lưu gắn với tài khoản Khách hàng của bạn.</p>
          <div class="vn-state-actions">
            <a href="#/login?next=${encodeURIComponent("#/tickets")}" class="vn-btn vn-btn-primary">
              Đăng nhập ngay
            </a>
            <a href="#/events" class="vn-btn vn-btn-secondary">Xem sự kiện</a>
          </div>
        </section>
      `;
      return;
    }

    container.innerHTML = `
      <div class="vn-skeleton" style="height:36px;width:240px;margin-bottom:24px;"></div>
      <div class="vn-skeleton" style="height:280px;border-radius:14px;margin-bottom:20px;"></div>
    `;

    try {
      const bookings = await api.getMyBookings();
      if (destroyed) return;
      renderList(bookings || []);
    } catch (err) {
      if (destroyed) return;
      container.innerHTML = `
        <section class="vn-state-box" role="alert">
          <h2>Không thể tải danh sách vé</h2>
          <p>${escapeHtml(err.message)}</p>
          <div class="vn-state-actions">
            <button type="button" class="vn-btn vn-btn-primary" data-action="retry">Thử lại</button>
          </div>
        </section>
      `;
      container.querySelector("[data-action='retry']")?.addEventListener("click", load);
    }
  }

  function renderList(bookings) {
    container.innerHTML = `
      <div class="vn-section-head">
        <div>
          <h1 class="vn-section-title">Vé đã đặt & mã QR</h1>
          <p class="vn-section-sub">
            Xuất trình mã QR tại cổng check-in sự kiện. Mỗi vé tương ứng một ghế duy nhất.
          </p>
        </div>
        <a href="#/events" class="vn-btn vn-btn-primary">
          Đặt thêm vé ${icons.arrowRight(15)}
        </a>
      </div>

      ${
        bookings.length === 0
          ? `
            <section class="vn-state-box">
              <h2>Bạn chưa có vé nào</h2>
              <p>Chọn một sự kiện đang mở bán, giữ ghế trên sơ đồ khán phòng và xác nhận để nhận vé điện tử kèm mã QR ngay lập tức.</p>
              <div class="vn-state-actions">
                <a href="#/events" class="vn-btn vn-btn-primary">Khám phá sự kiện</a>
              </div>
            </section>
          `
          : `
            <div class="vn-bookings-stack">
              ${bookings.map((b) => renderBookingCard(b, String(b.id) === highlightBookingId)).join("")}
            </div>
          `
      }
    `;

    // Zoom QR modal
    container.querySelectorAll("[data-zoom-ticket]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ticketCode = btn.dataset.zoomTicket;
        const seatNumber = btn.dataset.seatNumber;
        const eventName = btn.dataset.eventName;
        const bookingCode = btn.dataset.bookingCode;
        const statusLabel = btn.dataset.statusLabel;

        const close = openModal({
          title: `Vé điện tử — Ghế ${seatNumber}`,
          bodyHtml: `
            <div style="text-align:center;">
              <p style="font-weight:700;color:var(--vn-ink);margin-inline:auto;">${escapeHtml(eventName)}</p>
              <p class="vn-mono" style="font-size:12.5px;color:var(--vn-muted);margin-top:4px;margin-inline:auto;">
                Đơn ${escapeHtml(bookingCode)} · ${escapeHtml(statusLabel)}
              </p>
              <div class="vn-qr-large">${renderQrSvg(ticketCode, `Mã QR vé ${ticketCode}`)}</div>
              <p class="vn-mono" style="font-size:16px;font-weight:700;letter-spacing:0.06em;margin-inline:auto;">
                ${escapeHtml(ticketCode)}
              </p>
              <p style="font-size:12.5px;color:var(--vn-muted);margin-top:8px;margin-inline:auto;">
                Đưa mã QR này cho nhân viên soát vé khi check-in vào khán phòng.
              </p>
            </div>
          `,
          actionsHtml: `
            <button type="button" class="vn-btn vn-btn-secondary" data-action="print-qr">
              ${icons.printer(15)} In vé
            </button>
            <button type="button" class="vn-btn vn-btn-primary" data-modal-close>Đóng</button>
          `
        });

        document.querySelector("[data-action='print-qr']")?.addEventListener("click", () => {
          window.print();
          close();
        });
      });
    });

    // Cancel booking confirmation
    container.querySelectorAll("[data-cancel-booking]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.cancelBooking;
        const bookingCode = btn.dataset.bookingCode;
        const close = openModal({
          title: "Xác nhận hủy đơn đặt vé",
          bodyHtml: `
            <p style="color:var(--vn-ink-secondary);">
              Bạn có chắc chắn muốn hủy đơn <strong class="vn-mono">${escapeHtml(bookingCode)}</strong>?
              Tất cả vé ở trạng thái hợp lệ trong đơn sẽ chuyển sang <strong>Hết hiệu lực (VOID)</strong> và ghế sẽ được giải phóng.
            </p>
          `,
          actionsHtml: `
            <button type="button" class="vn-btn vn-btn-secondary" data-modal-close>Giữ lại đơn</button>
            <button type="button" class="vn-btn vn-btn-danger" data-confirm-cancel>Xác nhận hủy đơn</button>
          `
        });

        document.querySelector("[data-confirm-cancel]")?.addEventListener("click", async () => {
          close();
          try {
            await api.cancelBooking(bookingId);
            showNotice(`Đã hủy đơn ${bookingCode} và vô hiệu hóa các vé tương ứng.`, "success");
            load();
          } catch (err) {
            showNotice(err.message, "danger", 5200);
          }
        });
      });
    });
  }

  load();
  return () => {
    destroyed = true;
  };
}

function renderBookingCard(booking, isHighlighted) {
  const bStatus = bookingStatusMeta(booking.status);
  const tickets = Array.isArray(booking.tickets) ? booking.tickets : [];
  const hasUsedTicket = tickets.some((t) => t.status === "USED");
  const canCancel =
    booking.status === "CONFIRMED" && !hasUsedTicket && getMode() === "demo";

  return `
    <article
      class="vn-booking-record"
      style="${isHighlighted ? "border-color:var(--vn-accent);box-shadow:0 0 0 2px var(--vn-accent-soft);" : ""}"
    >
      <header class="vn-booking-header">
        <div class="vn-booking-header-main">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <h2>${escapeHtml(booking.eventName || `Sự kiện #${booking.eventId}`)}</h2>
            <span class="vn-badge ${bStatus.cls}">${escapeHtml(bStatus.label)}</span>
          </div>
          <div class="vn-booking-submeta">
            <span class="vn-mono">Mã đơn: <strong>${escapeHtml(booking.bookingCode)}</strong></span>
            <span>Đặt lúc: ${escapeHtml(formatDateTime(booking.createdAt))}</span>
            ${booking.venueName ? `<span>${escapeHtml(booking.venueName)}</span>` : ""}
          </div>
        </div>

        <div class="vn-booking-header-right">
          <div style="text-align:right;">
            <div style="font-size:12px;color:var(--vn-muted);">Tổng thanh toán</div>
            <div class="vn-mono" style="font-size:18px;font-weight:800;">${escapeHtml(formatMoney(booking.totalAmount))}</div>
          </div>
          ${
            canCancel
              ? `
                <button
                  type="button"
                  class="vn-btn vn-btn-danger-outline vn-btn-sm"
                  data-cancel-booking="${booking.id}"
                  data-booking-code="${escapeHtml(booking.bookingCode)}"
                >
                  Hủy đơn
                </button>
              `
              : ""
          }
        </div>
      </header>

      <div class="vn-tickets-list">
        ${
          tickets.length === 0
            ? `<p style="color:var(--vn-muted);">Đơn này chưa có dữ liệu chi tiết vé.</p>`
            : tickets.map((t) => renderTicketStub(t, booking)).join("")
        }
      </div>
    </article>
  `;
}

function renderTicketStub(ticket, booking) {
  const tStatus = ticketStatusMeta(ticket.status);
  const isVoid = ticket.status === "VOID";
  return `
    <div class="vn-ticket-stub ${isVoid ? "is-void" : ""}">
      <div class="vn-ticket-left">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span class="vn-badge ${tStatus.cls}">${escapeHtml(tStatus.label)}</span>
          <span class="vn-mono" style="font-size:13px;font-weight:700;">${escapeHtml(formatMoney(ticket.price))}</span>
        </div>

        <div>
          <div style="font-size:12px;color:var(--vn-muted);font-weight:600;">Vị trí ghế</div>
          <div class="vn-ticket-seat-big">${escapeHtml(ticket.seatNumber || `#${ticket.eventSeatId}`)}</div>
        </div>

        <div>
          <div class="vn-ticket-code">${escapeHtml(ticket.ticketCode)}</div>
          <div style="font-size:12px;color:var(--vn-muted);margin-top:2px;">
            Phát hành: ${escapeHtml(formatDateTime(ticket.issuedAt))}
          </div>
        </div>
      </div>

      <div class="vn-ticket-right">
        <div class="vn-qr-frame">
          ${renderQrSvg(ticket.ticketCode, `Mã QR vé ${ticket.ticketCode}`)}
        </div>
        <button
          type="button"
          class="vn-qr-zoom-btn"
          data-zoom-ticket="${escapeHtml(ticket.ticketCode)}"
          data-seat-number="${escapeHtml(ticket.seatNumber || "")}"
          data-event-name="${escapeHtml(booking.eventName || "")}"
          data-booking-code="${escapeHtml(booking.bookingCode || "")}"
          data-status-label="${escapeHtml(tStatus.label)}"
        >
          ${icons.qr(13)} Phóng to QR
        </button>
      </div>
    </div>
  `;
}
