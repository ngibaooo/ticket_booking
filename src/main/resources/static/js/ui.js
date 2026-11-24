import { icons } from "./icons.js";

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const currencyFmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

export function formatMoney(amount) {
  return currencyFmt.format(Number(amount || 0));
}

export function formatDateTime(iso) {
  if (!iso) return "Đang cập nhật";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export function formatDateShort(iso) {
  if (!iso) return "Đang cập nhật";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
}

export function formatCountdown(remainingMs) {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function eventStatusMeta(status) {
  const map = {
    OPEN: { label: "Đang mở bán", cls: "vn-badge-open" },
    UPCOMING: { label: "Sắp mở bán", cls: "vn-badge-upcoming" },
    CLOSED: { label: "Đã đóng bán", cls: "vn-badge-closed" },
    COMPLETED: { label: "Đã kết thúc", cls: "vn-badge-completed" },
    CANCELLED: { label: "Đã hủy", cls: "vn-badge-cancelled" },
    DRAFT: { label: "Bản nháp", cls: "vn-badge-closed" }
  };
  return map[status] || { label: status || "Không rõ", cls: "vn-badge-closed" };
}

export function bookingStatusMeta(status) {
  const map = {
    CONFIRMED: { label: "Đã xác nhận", cls: "vn-badge-confirmed" },
    COMPLETED: { label: "Hoàn tất", cls: "vn-badge-completed" },
    CANCELLED: { label: "Đã hủy", cls: "vn-badge-cancelled" }
  };
  return map[status] || { label: status || "Không rõ", cls: "vn-badge-closed" };
}

export function ticketStatusMeta(status) {
  const map = {
    VALID: { label: "Hợp lệ", cls: "vn-badge-valid" },
    USED: { label: "Đã sử dụng", cls: "vn-badge-used" },
    VOID: { label: "Hết hiệu lực", cls: "vn-badge-void" }
  };
  return map[status] || { label: status || "Không rõ", cls: "vn-badge-closed" };
}

export function fallbackBannerFor(event) {
  const id = Number(event?.id || 0);
  const pool = [
    "/assets/event-riverside.svg",
    "/assets/event-symphony.svg",
    "/assets/event-techconf.svg"
  ];
  return pool[Math.abs(id) % pool.length];
}

export function resolveBanner(event) {
  if (event?.bannerUrl && event.bannerUrl.trim()) {
    return event.bannerUrl.trim();
  }
  return fallbackBannerFor(event);
}

export function showNotice(message, tone = "info", durationMs = 4200) {
  const root = document.getElementById("vn-notices");
  if (!root) return;
  const toast = document.createElement("div");
  toast.className = `vn-toast is-${tone}`;
  const iconHtml =
    tone === "success"
      ? icons.check(17)
      : tone === "danger"
      ? icons.x(17)
      : icons.info(17);
  toast.innerHTML = `${iconHtml}<span>${escapeHtml(message)}</span>`;
  root.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, durationMs);
}

export function openModal({ title, bodyHtml, actionsHtml = "" }) {
  const root = document.getElementById("vn-modal-root");
  if (!root) return () => {};
  const previousFocus = document.activeElement;

  root.innerHTML = `
    <div class="vn-modal-backdrop" data-modal-close>
      <div class="vn-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="vn-modal-title">
        <div class="vn-modal-head">
          <h2 id="vn-modal-title">${escapeHtml(title)}</h2>
          <button type="button" class="vn-btn vn-btn-ghost vn-btn-sm" data-modal-close aria-label="Đóng hộp thoại">
            ${icons.x(18)}
          </button>
        </div>
        <div class="vn-modal-body">${bodyHtml}</div>
        ${actionsHtml ? `<div class="vn-state-actions" style="margin-top:20px;justify-content:flex-end;">${actionsHtml}</div>` : ""}
      </div>
    </div>
  `;

  const close = () => {
    root.innerHTML = "";
    window.removeEventListener("keydown", onKey);
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  root.addEventListener("click", (e) => {
    if (e.target === root.firstElementChild || e.target.closest("[data-modal-close]")) {
      close();
    }
  });
  window.addEventListener("keydown", onKey);

  const dialog = root.querySelector(".vn-modal-dialog");
  const focusable = dialog?.querySelector("button, [href], input");
  focusable?.focus();

  return close;
}
