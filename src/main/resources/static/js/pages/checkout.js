import {
  api,
  clearActiveHold,
  getActiveHold,
  getSession,
  HOLD_DURATION_SECONDS
} from "../api.js";
import { icons } from "../icons.js";
import {
  escapeHtml,
  formatCountdown,
  formatDateTime,
  formatMoney,
  showNotice
} from "../ui.js";

export function renderCheckoutPage(container, ctx, eventId) {
  let destroyed = false;
  let busy = false;
  let tickTimer = null;

  function render() {
    const session = getSession();
    if (!session) {
      ctx.navigate(`#/login?next=${encodeURIComponent(`#/checkout/${eventId}`)}`);
      return;
    }

    const hold = getActiveHold();
    if (!hold || String(hold.eventId) !== String(eventId)) {
      container.innerHTML = `
        <section class="vn-state-box">
          <h2>Không có phiên giữ ghế hợp lệ</h2>
          <p>
            Ghế bạn chọn có thể đã hết thời gian giữ 5 phút hoặc chưa được tạm giữ. Quay lại sơ đồ ghế để chọn và giữ chỗ mới.
          </p>
          <div class="vn-state-actions">
            <a href="#/events/${eventId}/seats" class="vn-btn vn-btn-primary">
              ${icons.arrowLeft(16)} Quay lại sơ đồ ghế
            </a>
            <a href="#/tickets" class="vn-btn vn-btn-secondary">Xem vé đã đặt</a>
          </div>
        </section>
      `;
      return;
    }

    const totalAmount = hold.seats.reduce((sum, s) => sum + Number(s.price || 0), 0);

    container.innerHTML = `
      <nav class="vn-breadcrumb" aria-label="Đường dẫn">
        <a href="#/events">Sự kiện</a>
        <span aria-hidden="true">/</span>
        <a href="#/events/${eventId}/seats">Sơ đồ ghế</a>
        <span aria-hidden="true">/</span>
        <span>Xác nhận đặt vé</span>
      </nav>

      <div class="vn-section-head">
        <div>
          <h1 class="vn-section-title">Xác nhận đặt vé</h1>
          <p class="vn-section-sub">Kiểm tra lại thông tin sự kiện, danh sách ghế và hoàn tất trước khi hết thời gian giữ chỗ.</p>
        </div>
      </div>

      <div class="vn-checkout-grid">
        <div>
          <section class="vn-panel" aria-labelledby="vn-co-event-title">
            <h2 id="vn-co-event-title" class="vn-panel-title">Thông tin sự kiện & ghế đang giữ</h2>
            <div class="vn-kv-list">
              <div class="vn-kv-row">
                <span class="vn-kv-label">Sự kiện</span>
                <span class="vn-kv-value">${escapeHtml(hold.eventName)}</span>
              </div>
              ${
                hold.venueName
                  ? `
                    <div class="vn-kv-row">
                      <span class="vn-kv-label">Địa điểm</span>
                      <span class="vn-kv-value">${escapeHtml(hold.venueName)}</span>
                    </div>
                  `
                  : ""
              }
              ${
                hold.startTime
                  ? `
                    <div class="vn-kv-row">
                      <span class="vn-kv-label">Thời gian</span>
                      <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(hold.startTime))}</span>
                    </div>
                  `
                  : ""
              }
            </div>

            <table class="vn-tier-table" style="margin-top:16px;">
              <thead>
                <tr>
                  <th>Số ghế</th>
                  <th>Hàng</th>
                  <th>Hạng ghế</th>
                  <th style="text-align:right;">Giá vé</th>
                </tr>
              </thead>
              <tbody>
                ${hold.seats
                  .map(
                    (s) => `
                      <tr>
                        <td class="vn-mono" style="font-weight:700;">${escapeHtml(s.seatNumber)}</td>
                        <td class="vn-mono">${escapeHtml(s.rowName || "-")}</td>
                        <td>
                          <span class="vn-badge ${
                            s.seatType === "VIP" ? "vn-badge-vip" : "vn-badge-standard"
                          }">${escapeHtml(s.seatType || "STANDARD")}</span>
                        </td>
                        <td class="vn-mono" style="text-align:right;font-weight:700;">${escapeHtml(formatMoney(s.price))}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </section>

          <section class="vn-panel" aria-labelledby="vn-co-buyer-title">
            <h2 id="vn-co-buyer-title" class="vn-panel-title">Thông tin người đặt vé</h2>
            <div class="vn-kv-list">
              <div class="vn-kv-row">
                <span class="vn-kv-label">Họ và tên</span>
                <span class="vn-kv-value">${escapeHtml(session.user.fullName)}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Email nhận vé</span>
                <span class="vn-kv-value">${escapeHtml(session.user.email)}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Số điện thoại</span>
                <span class="vn-kv-value vn-mono">${escapeHtml(session.user.phone || "Chưa cập nhật")}</span>
              </div>
            </div>
          </section>
        </div>

        <aside class="vn-booking-rail" aria-label="Hoàn tất xác nhận">
          <div class="vn-timer-box" data-hold-box role="status" aria-live="polite">
            <div class="vn-timer-top">
              <span>${icons.clock(15)} Thời gian giữ chỗ còn lại</span>
              <span class="vn-timer-clock" data-hold-clock>05:00</span>
            </div>
            <div class="vn-timer-track"><div class="vn-timer-fill" data-hold-bar style="width:100%;"></div></div>
          </div>

          <div class="vn-notice-box">
            ${icons.shield(18)}
            <div>
              <strong>Xác nhận giao dịch an toàn</strong>
              <p style="margin-top:4px;">
                Hệ thống kiểm tra lại khóa giữ ghế trên Redis và xác nhận nguyên tử trong PostgreSQL để chống đặt trùng ghế. Trong phạm vi đồ án, bước xác nhận không thu tiền qua cổng thanh toán thực.
              </p>
            </div>
          </div>

          <div class="vn-total-row">
            <span style="color:var(--vn-muted);font-weight:600;">Tổng cộng (${hold.seats.length} vé)</span>
            <span class="vn-total-amount">${escapeHtml(formatMoney(totalAmount))}</span>
          </div>

          <div class="vn-form-stack">
            <button
              type="button"
              class="vn-btn vn-btn-primary vn-btn-lg vn-btn-full"
              data-action="confirm"
              ${busy ? "disabled" : ""}
            >
              ${icons.check(16)}
              ${busy ? "Đang xác nhận và phát hành vé..." : "Xác nhận đặt vé"}
            </button>
            <button
              type="button"
              class="vn-btn vn-btn-danger-outline vn-btn-full"
              data-action="cancel-hold"
              ${busy ? "disabled" : ""}
            >
              Hủy giữ ghế & quay lại
            </button>
          </div>
        </aside>
      </div>
    `;

    container.querySelector("[data-action='confirm']")?.addEventListener("click", async () => {
      const currentHold = getActiveHold();
      if (!currentHold || busy) {
        render();
        return;
      }
      busy = true;
      render();
      try {
        const booking = await api.confirmBooking(currentHold.eventId, currentHold);
        showNotice(
          `Đặt vé thành công! Mã đơn ${booking.bookingCode} đã sẵn sàng với mã QR.`,
          "success",
          5000
        );
        ctx.refreshShell();
        ctx.navigate(`#/tickets?new=${encodeURIComponent(String(booking.id))}`);
      } catch (err) {
        showNotice(err.message, "danger", 5500);
        if (err.status === 409) {
          clearActiveHold();
          ctx.refreshShell();
          ctx.navigate(`#/events/${eventId}/seats`);
        }
      } finally {
        busy = false;
        if (!destroyed) render();
      }
    });

    container.querySelector("[data-action='cancel-hold']")?.addEventListener("click", async () => {
      const currentHold = getActiveHold();
      if (!currentHold || busy) return;
      busy = true;
      render();
      try {
        await api.releaseSeats(
          currentHold.eventId,
          currentHold.seats.map((s) => s.id)
        );
        showNotice("Đã hủy giữ ghế.", "info");
        ctx.refreshShell();
        ctx.navigate(`#/events/${eventId}/seats`);
      } catch (err) {
        showNotice(err.message, "danger");
      } finally {
        busy = false;
        if (!destroyed) render();
      }
    });

    updateTimer();
  }

  function updateTimer() {
    const hold = getActiveHold();
    const clockEl = container.querySelector("[data-hold-clock]");
    const barEl = container.querySelector("[data-hold-bar]");
    const boxEl = container.querySelector("[data-hold-box]");
    if (!hold || !clockEl) return;

    const remainingMs = hold.expiresAt - Date.now();
    if (remainingMs <= 0) {
      clearActiveHold();
      ctx.refreshShell();
      showNotice("Hết 5 phút giữ chỗ. Ghế đã được trả về trạng thái trống.", "warning", 5200);
      render();
      return;
    }

    clockEl.textContent = formatCountdown(remainingMs);
    const pct = Math.max(0, Math.min(100, (remainingMs / (HOLD_DURATION_SECONDS * 1000)) * 100));
    if (barEl) barEl.style.width = `${pct}%`;
    if (boxEl) boxEl.classList.toggle("is-urgent", remainingMs <= 60000);
  }

  render();
  tickTimer = window.setInterval(() => {
    if (!destroyed) updateTimer();
  }, 1000);

  return () => {
    destroyed = true;
    window.clearInterval(tickTimer);
  };
}
