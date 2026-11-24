import { api } from "../api.js";
import { icons } from "../icons.js";
import {
  escapeHtml,
  eventStatusMeta,
  fallbackBannerFor,
  formatDateTime,
  formatMoney,
  resolveBanner
} from "../ui.js";

export function renderEventDetailPage(container, ctx, eventId) {
  let destroyed = false;

  async function load() {
    container.innerHTML = `
      <div class="vn-skeleton" style="height:24px;width:240px;margin-bottom:20px;"></div>
      <div class="vn-detail-layout">
        <div class="vn-skeleton" style="height:420px;border-radius:14px;"></div>
        <div class="vn-skeleton" style="height:360px;border-radius:14px;"></div>
      </div>
    `;

    try {
      const [ev, seatsResp] = await Promise.all([
        api.getEventById(eventId),
        api.getEventSeats(eventId).catch(() => ({ seats: [] }))
      ]);
      if (destroyed) return;

      const seats = (seatsResp?.seats || []).filter((s) => s.isActive !== false);
      const stats = computeSeatStats(seats);
      const st = eventStatusMeta(ev.status);
      const canBook = ev.status === "OPEN";

      container.innerHTML = `
        <nav class="vn-breadcrumb" aria-label="Đường dẫn">
          <a href="#/events">Sự kiện</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(ev.eventName)}</span>
        </nav>

        <div class="vn-detail-layout">
          <div>
            <div class="vn-detail-hero">
              <img
                src="${escapeHtml(resolveBanner(ev))}"
                data-fallback="${escapeHtml(fallbackBannerFor(ev))}"
                alt="Hình ảnh sự kiện ${escapeHtml(ev.eventName)}"
              >
            </div>

            <div class="vn-detail-header">
              <div><span class="vn-badge ${st.cls}">${escapeHtml(st.label)}</span></div>
              <h1>${escapeHtml(ev.eventName)}</h1>
            </div>

            <section class="vn-panel" aria-labelledby="vn-desc-heading">
              <h2 id="vn-desc-heading" class="vn-panel-title">Giới thiệu sự kiện</h2>
              <p class="vn-prose">${escapeHtml(
                ev.description || "Thông tin chi tiết sự kiện đang được ban tổ chức cập nhật."
              )}</p>

              ${
                stats.tiers.length > 0
                  ? `
                    <h3 style="margin-top:28px;font-size:16px;font-weight:800;">Bảng giá theo hạng ghế</h3>
                    <table class="vn-tier-table">
                      <thead>
                        <tr>
                          <th>Hạng ghế</th>
                          <th>Giá vé</th>
                          <th>Còn trống</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${stats.tiers
                          .map(
                            (t) => `
                              <tr>
                                <td>
                                  <span class="vn-badge ${
                                    t.type === "VIP" ? "vn-badge-vip" : "vn-badge-standard"
                                  }">${escapeHtml(t.type)}</span>
                                </td>
                                <td class="vn-mono" style="font-weight:700;">${escapeHtml(t.priceLabel)}</td>
                                <td class="vn-mono">${t.available} / ${t.total} ghế</td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  `
                  : ""
              }
            </section>
          </div>

          <aside class="vn-detail-panel" aria-label="Thông tin đặt vé">
            <h2>Thông tin tổ chức</h2>

            <div class="vn-kv-list">
              <div class="vn-kv-row">
                <span class="vn-kv-label">Địa điểm</span>
                <span class="vn-kv-value">${escapeHtml(ev.venueName || "Đang cập nhật")}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Bắt đầu</span>
                <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(ev.startTime))}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Kết thúc</span>
                <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(ev.endTime))}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Mở bán vé</span>
                <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(ev.saleStartTime))}</span>
              </div>
              <div class="vn-kv-row">
                <span class="vn-kv-label">Đóng bán vé</span>
                <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(ev.saleEndTime))}</span>
              </div>
              ${
                stats.priceRange
                  ? `
                    <div class="vn-kv-row">
                      <span class="vn-kv-label">Giá vé từ</span>
                      <span class="vn-kv-value vn-mono" style="color:var(--vn-accent);">${escapeHtml(stats.priceRange)}</span>
                    </div>
                  `
                  : ""
              }
            </div>

            ${
              seats.length > 0
                ? `
                  <div class="vn-seat-summary-bar" aria-label="Tình trạng ghế hiện tại">
                    <div>
                      <span class="vn-seat-summary-num" style="color:var(--vn-success);">${stats.available}</span>
                      <span class="vn-seat-summary-lbl">Còn trống</span>
                    </div>
                    <div>
                      <span class="vn-seat-summary-num" style="color:var(--vn-warning);">${stats.held}</span>
                      <span class="vn-seat-summary-lbl">Đang giữ</span>
                    </div>
                    <div>
                      <span class="vn-seat-summary-num" style="color:var(--vn-muted);">${stats.booked}</span>
                      <span class="vn-seat-summary-lbl">Đã đặt</span>
                    </div>
                  </div>
                `
                : ""
            }

            <div class="vn-form-stack">
              <a
                href="#/events/${ev.id}/seats"
                class="vn-btn vn-btn-primary vn-btn-lg vn-btn-full"
              >
                ${canBook ? "Xem sơ đồ & chọn ghế" : "Xem sơ đồ ghế"}
                ${icons.arrowRight(16)}
              </a>
              <a href="#/events" class="vn-btn vn-btn-secondary vn-btn-full">
                ${icons.arrowLeft(15)} Quay lại danh sách
              </a>
            </div>
          </aside>
        </div>
      `;

      const img = container.querySelector("img[data-fallback]");
      img?.addEventListener("error", () => {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = "1";
        img.src = img.dataset.fallback;
      });
    } catch (err) {
      if (destroyed) return;
      container.innerHTML = `
        <section class="vn-state-box" role="alert">
          <h2>Không thể tải thông tin sự kiện</h2>
          <p>${escapeHtml(err.message)}</p>
          <div class="vn-state-actions">
            <a href="#/events" class="vn-btn vn-btn-primary">Quay lại danh sách sự kiện</a>
          </div>
        </section>
      `;
    }
  }

  load();
  return () => {
    destroyed = true;
  };
}

function computeSeatStats(seats) {
  let available = 0;
  let held = 0;
  let booked = 0;
  const byType = new Map();
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const s of seats) {
    const p = Number(s.price || 0);
    if (p < minPrice) minPrice = p;
    if (p > maxPrice) maxPrice = p;

    const isBooked = s.status === "BOOKED";
    const isHeld = !isBooked && Boolean(s.isHeld);
    if (isBooked) booked++;
    else if (isHeld) held++;
    else available++;

    const type = s.seatType || "STANDARD";
    if (!byType.has(type)) {
      byType.set(type, { type, min: Infinity, max: 0, available: 0, total: 0 });
    }
    const bucket = byType.get(type);
    bucket.total++;
    if (!isBooked && !isHeld) bucket.available++;
    if (p < bucket.min) bucket.min = p;
    if (p > bucket.max) bucket.max = p;
  }

  const tiers = [...byType.values()]
    .sort((a, b) => (a.type === "VIP" ? -1 : b.type === "VIP" ? 1 : 0))
    .map((t) => ({
      ...t,
      priceLabel:
        t.min === t.max
          ? formatMoney(t.min)
          : `${formatMoney(t.min)} – ${formatMoney(t.max)}`
    }));

  const priceRange =
    seats.length > 0 && Number.isFinite(minPrice)
      ? minPrice === maxPrice
        ? formatMoney(minPrice)
        : `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`
      : "";

  return { available, held, booked, tiers, priceRange };
}
