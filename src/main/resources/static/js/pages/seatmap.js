import {
  api,
  clearActiveHold,
  getActiveHold,
  getSession,
  HOLD_DURATION_SECONDS,
  MAX_SEATS_PER_ORDER
} from "../api.js";
import { icons } from "../icons.js";
import {
  escapeHtml,
  eventStatusMeta,
  formatCountdown,
  formatDateTime,
  formatMoney,
  showNotice
} from "../ui.js";

const POLL_INTERVAL_MS = 10000;

export function renderSeatmapPage(container, ctx, eventId) {
  let destroyed = false;
  let eventData = null;
  let seatsData = [];
  let selectedIds = new Set();
  let lastSyncedAt = null;
  let busy = false;
  let pollTimer = null;
  let tickTimer = null;

  function myHoldForThisEvent() {
    const hold = getActiveHold();
    return hold && String(hold.eventId) === String(eventId) ? hold : null;
  }

  function myHoldForOtherEvent() {
    const hold = getActiveHold();
    return hold && String(hold.eventId) !== String(eventId) ? hold : null;
  }

  async function loadAll(silent = false) {
    if (!silent) {
      container.innerHTML = `
        <div class="vn-skeleton" style="height:24px;width:280px;margin-bottom:20px;"></div>
        <div class="vn-seatmap-layout">
          <div class="vn-skeleton" style="height:520px;border-radius:14px;"></div>
          <div class="vn-skeleton" style="height:400px;border-radius:14px;"></div>
        </div>
      `;
    }

    try {
      const [ev, seatResp] = await Promise.all([
        eventData ? Promise.resolve(eventData) : api.getEventById(eventId),
        api.getEventSeats(eventId)
      ]);
      if (destroyed) return;
      eventData = ev;
      seatsData = seatResp?.seats || [];
      lastSyncedAt = new Date();

      // Drop selected seats that became unavailable during polling
      const mine = myHoldForThisEvent();
      const mineIds = new Set((mine?.seats || []).map((s) => s.id));
      for (const id of [...selectedIds]) {
        const s = seatsData.find((item) => item.id === id);
        if (
          !s ||
          s.isActive === false ||
          s.status === "BOOKED" ||
          (s.isHeld && !mineIds.has(s.id))
        ) {
          selectedIds.delete(id);
        }
      }
      render();
    } catch (err) {
      if (destroyed) return;
      if (silent) return;
      container.innerHTML = `
        <section class="vn-state-box" role="alert">
          <h2>Không thể tải sơ đồ ghế</h2>
          <p>${escapeHtml(err.message)}</p>
          <div class="vn-state-actions">
            <a href="#/events/${eventId}" class="vn-btn vn-btn-secondary">Quay lại sự kiện</a>
            <button type="button" class="vn-btn vn-btn-primary" data-action="reload">Thử lại</button>
          </div>
        </section>
      `;
      container.querySelector("[data-action='reload']")?.addEventListener("click", () => loadAll(false));
    }
  }

  function render() {
    if (!eventData) return;
    const session = getSession();
    const isGuest = !session;
    const isOpen = eventData.status === "OPEN";
    const st = eventStatusMeta(eventData.status);
    const activeHold = myHoldForThisEvent();
    const otherHold = myHoldForOtherEvent();
    const heldByMeIds = new Set((activeHold?.seats || []).map((s) => s.id));

    const { rows, maxX } = organizeRows(seatsData);

    const selectedSeats = seatsData
      .filter((s) => selectedIds.has(s.id))
      .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
    const displaySeats = activeHold ? activeHold.seats : selectedSeats;
    const totalAmount = displaySeats.reduce((sum, s) => sum + Number(s.price || 0), 0);

    const syncLabel = lastSyncedAt
      ? lastSyncedAt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      : "--:--:--";

    container.innerHTML = `
      <nav class="vn-breadcrumb" aria-label="Đường dẫn">
        <a href="#/events">Sự kiện</a>
        <span aria-hidden="true">/</span>
        <a href="#/events/${eventData.id}">${escapeHtml(eventData.eventName)}</a>
        <span aria-hidden="true">/</span>
        <span>Sơ đồ ghế</span>
      </nav>

      <div class="vn-seatmap-layout">
        <section class="vn-auditorium" aria-labelledby="vn-seatmap-heading">
          <div class="vn-auditorium-top">
            <div>
              <h1 id="vn-seatmap-heading">${escapeHtml(eventData.eventName)}</h1>
              <p class="vn-section-sub">
                ${escapeHtml(eventData.venueName || "")} · ${escapeHtml(formatDateTime(eventData.startTime))}
              </p>
            </div>
            <div class="vn-sync-meta">
              <span class="vn-badge ${st.cls}">${escapeHtml(st.label)}</span>
              <span class="vn-mono" title="Tự động đồng bộ mỗi 10 giây">Cập nhật ${syncLabel}</span>
              <button
                type="button"
                class="vn-btn vn-btn-secondary vn-btn-sm"
                data-action="refresh"
                ${busy ? "disabled" : ""}
              >
                ${icons.refresh(14)} Làm mới
              </button>
            </div>
          </div>

          <div class="vn-legend" aria-label="Chú giải trạng thái ghế">
            <span class="vn-legend-item"><span class="vn-legend-swatch is-available"></span> Ghế thường trống</span>
            <span class="vn-legend-item"><span class="vn-legend-swatch is-vip"></span> Ghế VIP trống</span>
            <span class="vn-legend-item"><span class="vn-legend-swatch is-selected"></span> Đang chọn</span>
            <span class="vn-legend-item"><span class="vn-legend-swatch is-held"></span> Đang giữ chỗ</span>
            <span class="vn-legend-item"><span class="vn-legend-swatch is-booked"></span> Đã đặt</span>
          </div>

          <div class="vn-stage-wrap">
            <div class="vn-stage">Sân khấu</div>
          </div>

          ${
            rows.length === 0
              ? `<div class="vn-state-box"><h2>Chưa có sơ đồ ghế</h2><p>Ban tổ chức chưa cấu hình ghế cho sự kiện này.</p></div>`
              : `
                <div class="vn-grid-scroll">
                  <div class="vn-seat-rows" role="group" aria-label="Sơ đồ chỗ ngồi khán phòng">
                    ${rows
                      .map(
                        (row) => `
                          <div class="vn-seat-row">
                            <span class="vn-row-label" aria-hidden="true">${escapeHtml(row.label)}</span>
                            <div class="vn-seat-cells" style="grid-template-columns: repeat(${maxX}, 38px);">
                              ${renderRowCells(row, maxX, {
                                selectedIds,
                                heldByMeIds,
                                hasActiveHold: Boolean(activeHold),
                                isOpen,
                                isGuest
                              })}
                            </div>
                            <span class="vn-row-label" aria-hidden="true">${escapeHtml(row.label)}</span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
          }
        </section>

        <aside class="vn-booking-rail" aria-label="Tóm tắt chọn ghế">
          ${renderRailContent({
            isGuest,
            isOpen,
            activeHold,
            otherHold,
            displaySeats,
            totalAmount,
            busy,
            eventId: eventData.id
          })}
        </aside>
      </div>
    `;

    bindEvents();
    updateTimerDisplay();
  }

  function bindEvents() {
    container.querySelector("[data-action='refresh']")?.addEventListener("click", () => {
      loadAll(true);
      showNotice("Đã làm mới trạng thái ghế mới nhất.", "info", 2200);
    });

    container.querySelectorAll("button[data-seat-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const seatId = Number(btn.dataset.seatId);
        const seat = seatsData.find((s) => s.id === seatId);
        if (!seat) return;

        if (!getSession()) {
          showNotice("Vui lòng đăng nhập tài khoản Khách hàng để chọn và giữ ghế.", "warning");
          ctx.navigate(`#/login?next=${encodeURIComponent(`#/events/${eventId}/seats`)}`);
          return;
        }

        if (myHoldForThisEvent()) {
          showNotice("Bạn đang giữ ghế cho sự kiện này. Hãy xác nhận hoặc hủy giữ ghế trước khi chọn lại.", "info");
          return;
        }

        if (myHoldForOtherEvent()) {
          showNotice("Bạn đang giữ ghế ở một sự kiện khác. Hãy hoàn tất hoặc hủy giữ ghế đó trước.", "warning");
          return;
        }

        if (selectedIds.has(seatId)) {
          selectedIds.delete(seatId);
        } else {
          if (selectedIds.size >= MAX_SEATS_PER_ORDER) {
            showNotice(`Mỗi lượt đặt chỉ được chọn tối đa ${MAX_SEATS_PER_ORDER} ghế.`, "warning");
            return;
          }
          selectedIds.add(seatId);
        }
        render();
      });
    });

    container.querySelectorAll("[data-remove-seat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedIds.delete(Number(btn.dataset.removeSeat));
        render();
      });
    });

    container.querySelector("[data-action='hold-seats']")?.addEventListener("click", async () => {
      if (busy || selectedIds.size === 0) return;
      const seatObjects = seatsData.filter((s) => selectedIds.has(s.id));
      busy = true;
      render();
      try {
        await api.holdSeats(eventData.id, seatObjects, eventData);
        selectedIds.clear();
        showNotice(
          `Đã tạm giữ ${seatObjects.length} ghế trong 5 phút. Hãy hoàn tất xác nhận trước khi hết giờ.`,
          "success"
        );
        ctx.refreshShell();
        await loadAll(true);
      } catch (err) {
        showNotice(err.message, "danger", 5200);
        if (err.status === 409) {
          selectedIds.clear();
          await loadAll(true);
        }
      } finally {
        busy = false;
        if (!destroyed) render();
      }
    });

    container.querySelector("[data-action='release-hold']")?.addEventListener("click", async () => {
      const hold = myHoldForThisEvent();
      if (!hold || busy) return;
      busy = true;
      render();
      try {
        await api.releaseSeats(
          hold.eventId,
          hold.seats.map((s) => s.id)
        );
        showNotice("Đã hủy giữ ghế. Các ghế đã được giải phóng.", "info");
        ctx.refreshShell();
        await loadAll(true);
      } catch (err) {
        showNotice(err.message, "danger");
      } finally {
        busy = false;
        if (!destroyed) render();
      }
    });
  }

  function updateTimerDisplay() {
    const hold = myHoldForThisEvent();
    const clockEl = container.querySelector("[data-hold-clock]");
    const barEl = container.querySelector("[data-hold-bar]");
    const boxEl = container.querySelector("[data-hold-box]");
    if (!hold || !clockEl) return;

    const remainingMs = hold.expiresAt - Date.now();
    if (remainingMs <= 0) {
      clearActiveHold();
      ctx.refreshShell();
      showNotice("Hết thời gian giữ ghế 5 phút. Ghế đã được tự động giải phóng.", "warning", 5000);
      loadAll(true);
      return;
    }

    clockEl.textContent = formatCountdown(remainingMs);
    const pct = Math.max(0, Math.min(100, (remainingMs / (HOLD_DURATION_SECONDS * 1000)) * 100));
    if (barEl) barEl.style.width = `${pct}%`;
    if (boxEl) boxEl.classList.toggle("is-urgent", remainingMs <= 60000);
  }

  loadAll(false);
  pollTimer = window.setInterval(() => {
    if (!destroyed && !busy) loadAll(true);
  }, POLL_INTERVAL_MS);
  tickTimer = window.setInterval(() => {
    if (!destroyed) updateTimerDisplay();
  }, 1000);

  return () => {
    destroyed = true;
    window.clearInterval(pollTimer);
    window.clearInterval(tickTimer);
  };
}

function organizeRows(seats) {
  if (!seats || seats.length === 0) return { rows: [], maxX: 0 };
  const rowMap = new Map();
  let maxX = 1;

  for (const s of seats) {
    const y = Number(s.positionY || 1);
    const x = Number(s.positionX || 1);
    if (x > maxX) maxX = x;
    if (!rowMap.has(y)) {
      rowMap.set(y, { y, label: s.rowName || String(y), byX: new Map() });
    }
    rowMap.get(y).byX.set(x, s);
  }

  const rows = [...rowMap.values()].sort((a, b) => a.y - b.y);
  return { rows, maxX };
}

function renderRowCells(row, maxX, opts) {
  let html = "";
  for (let x = 1; x <= maxX; x++) {
    const seat = row.byX.get(x);
    if (!seat) {
      html += `<span class="vn-seat-gap" aria-hidden="true"></span>`;
      continue;
    }

    const inactive = seat.isActive === false;
    const isBooked = seat.status === "BOOKED";
    const isMineHeld = opts.heldByMeIds.has(seat.id);
    const isHeldOther = !isBooked && Boolean(seat.isHeld) && !isMineHeld;
    const isSelected = opts.selectedIds.has(seat.id);
    const isVip = seat.seatType === "VIP";

    const classes = ["vn-seat"];
    if (isVip) classes.push("is-vip");
    if (inactive) classes.push("is-inactive");
    else if (isBooked) classes.push("is-booked");
    else if (isMineHeld) classes.push("is-mine-held");
    else if (isHeldOther) classes.push("is-held");
    else if (isSelected) classes.push("is-selected");

    const disabled =
      inactive ||
      isBooked ||
      isHeldOther ||
      !opts.isOpen ||
      (opts.hasActiveHold && !isMineHeld);

    const statusText = inactive
      ? "Ngưng sử dụng"
      : isBooked
      ? "Đã đặt"
      : isMineHeld
      ? "Bạn đang giữ"
      : isHeldOther
      ? "Đang được người khác giữ"
      : isSelected
      ? "Đang chọn"
      : "Còn trống";

    const title = `${seat.seatNumber} (${seat.seatType}) — ${formatMoney(seat.price)} — ${statusText}`;

    html += `
      <button
        type="button"
        class="${classes.join(" ")}"
        data-seat-id="${seat.id}"
        title="${escapeHtml(title)}"
        aria-label="${escapeHtml(title)}"
        aria-pressed="${isSelected || isMineHeld ? "true" : "false"}"
        ${disabled ? "disabled" : ""}
      >
        ${escapeHtml(seat.seatNumber)}
      </button>
    `;
  }
  return html;
}

function renderRailContent({
  isGuest,
  isOpen,
  activeHold,
  otherHold,
  displaySeats,
  totalAmount,
  busy,
  eventId
}) {
  const loginReturn = `#/login?next=${encodeURIComponent(`#/events/${eventId}/seats`)}`;

  if (!isOpen) {
    return `
      <div>
        <h2 style="font-size:18px;font-weight:800;">Chế độ xem sơ đồ ghế</h2>
        <p class="vn-section-sub" style="margin-top:6px;">
          Sự kiện hiện không ở trạng thái mở bán. Bạn có thể xem trước vị trí và tình trạng ghế.
        </p>
      </div>
      <a href="#/events/${eventId}" class="vn-btn vn-btn-secondary vn-btn-full">
        ${icons.arrowLeft(15)} Quay lại chi tiết sự kiện
      </a>
    `;
  }

  return `
    ${
      activeHold
        ? `
          <div class="vn-timer-box" data-hold-box role="status" aria-live="polite">
            <div class="vn-timer-top">
              <span>${icons.clock(15)} Đang giữ ghế tạm thời</span>
              <span class="vn-timer-clock" data-hold-clock>05:00</span>
            </div>
            <div class="vn-timer-track"><div class="vn-timer-fill" data-hold-bar style="width:100%;"></div></div>
          </div>
        `
        : ""
    }

    ${
      otherHold
        ? `
          <div class="vn-guest-callout">
            <strong>Bạn đang giữ ${otherHold.seats.length} ghế ở sự kiện khác</strong>
            <span>${escapeHtml(otherHold.eventName)}</span>
            <a href="#/checkout/${otherHold.eventId}" class="vn-btn vn-btn-primary vn-btn-sm">
              Đi tới xác nhận đơn đang giữ
            </a>
          </div>
        `
        : ""
    }

    ${
      isGuest
        ? `
          <div class="vn-guest-callout">
            <strong>Đăng nhập để chọn và giữ ghế</strong>
            <span>Khách truy cập có thể xem sơ đồ và giá vé. Để tạm giữ chỗ 5 phút và đặt vé, vui lòng đăng nhập tài khoản Khách hàng.</span>
            <a href="${loginReturn}" class="vn-btn vn-btn-primary vn-btn-sm">
              Đăng nhập / Đăng ký
            </a>
          </div>
        `
        : ""
    }

    <div>
      <h2 style="font-size:18px;font-weight:800;">
        ${activeHold ? "Ghế bạn đang giữ" : "Ghế đã chọn"}
        <span class="vn-mono" style="font-size:14px;color:var(--vn-muted);font-weight:600;">
          (${displaySeats.length}/${MAX_SEATS_PER_ORDER})
        </span>
      </h2>
      <p class="vn-section-sub" style="margin-top:4px;">
        ${
          activeHold
            ? "Tiếp tục xác nhận trước khi hết thời gian giữ chỗ 5 phút."
            : `Chọn tối đa ${MAX_SEATS_PER_ORDER} ghế còn trống trên sơ đồ bên trái.`
        }
      </p>
    </div>

    ${
      displaySeats.length === 0
        ? `
          <div style="padding:20px 14px;border:1px dashed var(--vn-line-strong);border-radius:8px;text-align:center;color:var(--vn-muted);font-size:13.5px;">
            Chưa có ghế nào được chọn
          </div>
        `
        : `
          <div class="vn-selected-list">
            ${displaySeats
              .map(
                (s) => `
                  <div class="vn-selected-item">
                    <div class="vn-selected-item-left">
                      <span class="vn-seat-tag">${escapeHtml(s.seatNumber)}</span>
                      <span class="vn-badge ${
                        s.seatType === "VIP" ? "vn-badge-vip" : "vn-badge-standard"
                      }">${escapeHtml(s.seatType || "STANDARD")}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <strong class="vn-mono" style="font-size:13.5px;">${escapeHtml(formatMoney(s.price))}</strong>
                      ${
                        !activeHold
                          ? `<button type="button" class="vn-remove-seat" data-remove-seat="${s.id}" aria-label="Bỏ chọn ghế ${escapeHtml(s.seatNumber)}">${icons.x(14)}</button>`
                          : ""
                      }
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        `
    }

    <div class="vn-total-row">
      <span style="color:var(--vn-muted);font-weight:600;">Tạm tính</span>
      <span class="vn-total-amount">${escapeHtml(formatMoney(totalAmount))}</span>
    </div>

    <div class="vn-form-stack">
      ${
        activeHold
          ? `
            <a href="#/checkout/${eventId}" class="vn-btn vn-btn-primary vn-btn-lg vn-btn-full">
              Tiếp tục xác nhận đặt vé ${icons.arrowRight(16)}
            </a>
            <button
              type="button"
              class="vn-btn vn-btn-danger-outline vn-btn-full"
              data-action="release-hold"
              ${busy ? "disabled" : ""}
            >
              ${busy ? "Đang giải phóng..." : "Hủy giữ ghế"}
            </button>
          `
          : `
            <button
              type="button"
              class="vn-btn vn-btn-primary vn-btn-lg vn-btn-full"
              data-action="hold-seats"
              ${isGuest || displaySeats.length === 0 || busy || Boolean(otherHold) ? "disabled" : ""}
            >
              ${busy ? "Đang khóa ghế trên Redis..." : "Giữ ghế trong 5 phút"}
            </button>
          `
      }
    </div>
  `;
}
