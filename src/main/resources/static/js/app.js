import {
  clearActiveHold,
  getActiveHold,
  getMode,
  getSession,
  resetDemoData,
  setMode
} from "./api.js";
import { icons } from "./icons.js";
import { renderAuthPage, renderProfilePage } from "./pages/auth.js";
import { renderCheckoutPage } from "./pages/checkout.js";
import { renderEventDetailPage } from "./pages/event-detail.js";
import { renderEventsPage } from "./pages/events.js";
import { renderSeatmapPage } from "./pages/seatmap.js";
import { renderTicketsPage } from "./pages/tickets.js";
import { escapeHtml, formatCountdown, showNotice } from "./ui.js";

const appRoot = document.getElementById("vn-app");
let cleanupCurrentPage = null;
let globalHoldInterval = null;

function parseHash() {
  const raw = window.location.hash || "#/events";
  const cleaned = raw.startsWith("#") ? raw.slice(1) : raw;
  const [pathPart, queryPart] = cleaned.split("?");
  const path = pathPart && pathPart.startsWith("/") ? pathPart : "/events";
  const query = new URLSearchParams(queryPart || "");
  return { path, query };
}

function navigate(hash) {
  if (window.location.hash === hash) {
    renderRoute();
  } else {
    window.location.hash = hash;
  }
}

function initialsOf(name) {
  const parts = String(name || "VN").trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || "V").toUpperCase();
}

function renderModeStrip() {
  const mode = getMode();
  const strip = document.getElementById("vn-mode-strip");
  if (!strip) return;
  strip.innerHTML = `
    <div class="vn-container vn-mode-strip-inner">
      <span class="vn-mode-indicator">
        <span class="vn-dot ${mode === "demo" ? "is-demo" : ""}" aria-hidden="true"></span>
        <span>${
          mode === "demo"
            ? "Đang dùng <strong>Dữ liệu mẫu (Demo)</strong> — mô phỏng giữ ghế Redis 5 phút & mã QR"
            : "Đang kết nối <strong>Backend thật (/api/v1)</strong> — Spring Boot, PostgreSQL & Redis"
        }</span>
      </span>

      <div style="display:flex;align-items:center;gap:12px;">
        ${
          mode === "demo"
            ? `<button type="button" class="vn-btn vn-btn-ghost vn-btn-sm" id="vn-reset-demo">Đặt lại dữ liệu mẫu</button>`
            : ""
        }
        <button type="button" class="vn-btn vn-btn-secondary vn-btn-sm" id="vn-toggle-mode">
          ${mode === "demo" ? "Chuyển sang Backend thật" : "Dùng dữ liệu mẫu"}
        </button>
      </div>
    </div>
  `;

  document.getElementById("vn-toggle-mode")?.addEventListener("click", () => {
    const next = getMode() === "demo" ? "live" : "demo";
    setMode(next);
    showNotice(
      next === "demo"
        ? "Đã chuyển sang chế độ Dữ liệu mẫu (tài khoản mẫu: khachhang@venha.vn / Password123)."
        : "Đã chuyển sang chế độ kết nối Backend thật (/api/v1).",
      "info",
      4500
    );
    navigate("#/events");
  });

  document.getElementById("vn-reset-demo")?.addEventListener("click", () => {
    resetDemoData();
    showNotice("Đã khôi phục dữ liệu mẫu ban đầu.", "success");
    renderRoute();
  });
}

function renderShell(activePath) {
  const session = getSession();
  const hold = getActiveHold();

  appRoot.innerHTML = `
    <header class="vn-header">
      <div class="vn-container vn-header-inner">
        <a href="#/events" class="vn-brand" aria-label="Vé Nhà — Trang chủ">
          <span class="vn-brand-mark">${icons.ticket(18)}</span>
          <span>Vé Nhà</span>
        </a>

        <nav class="vn-nav" aria-label="Điều hướng chính">
          <a
            href="#/events"
            class="vn-nav-link"
            ${activePath.startsWith("/events") ? 'aria-current="page"' : ""}
          >
            ${icons.calendar(15)} Sự kiện
          </a>
          <a
            href="#/tickets"
            class="vn-nav-link"
            ${activePath.startsWith("/tickets") ? 'aria-current="page"' : ""}
          >
            ${icons.qr(15)} Vé của tôi
          </a>
        </nav>

        <div class="vn-header-actions">
          <a
            href="${hold ? `#/checkout/${hold.eventId}` : "#/events"}"
            class="vn-hold-pill"
            id="vn-global-hold-pill"
            style="${hold ? "" : "display:none;"}"
            title="Hoàn tất xác nhận các ghế đang giữ"
          >
            ${icons.clock(14)}
            <span>Giữ ${hold ? hold.seats.length : 0} ghế</span>
            <span class="vn-mono" id="vn-global-hold-clock">
              ${hold ? formatCountdown(hold.expiresAt - Date.now()) : "05:00"}
            </span>
          </a>

          ${
            session
              ? `
                <a href="#/profile" class="vn-user-chip" ${
                  activePath === "/profile" ? 'aria-current="page"' : ""
                }>
                  <span class="vn-user-avatar" aria-hidden="true">${escapeHtml(initialsOf(session.user.fullName))}</span>
                  <span>${escapeHtml(session.user.fullName)}</span>
                </a>
              `
              : `
                <a href="#/login" class="vn-btn vn-btn-secondary vn-btn-sm">Đăng nhập</a>
                <a href="#/register" class="vn-btn vn-btn-primary vn-btn-sm">Đăng ký</a>
              `
          }
        </div>
      </div>
    </header>

    <div class="vn-mode-strip" id="vn-mode-strip"></div>

    <main id="vn-main" class="vn-main" tabindex="-1">
      <div class="vn-container" id="vn-page-root"></div>
    </main>

    <footer class="vn-footer">
      <div class="vn-container vn-footer-inner">
        <span><strong>Vé Nhà</strong> · Hệ thống vé điện tử và đặt chỗ thời gian thực</span>
        <div class="vn-footer-links">
          <a href="#/events">Sự kiện</a>
          <a href="#/tickets">Vé của tôi</a>
          <a href="#/profile">Tài khoản</a>
        </div>
      </div>
    </footer>
  `;

  renderModeStrip();
}

function syncGlobalHoldPill() {
  const pill = document.getElementById("vn-global-hold-pill");
  const clock = document.getElementById("vn-global-hold-clock");
  if (!pill || !clock) return;

  const hold = getActiveHold();
  if (!hold) {
    pill.style.display = "none";
    return;
  }

  const remaining = hold.expiresAt - Date.now();
  if (remaining <= 0) {
    clearActiveHold();
    pill.style.display = "none";
    return;
  }

  pill.style.display = "inline-flex";
  pill.href = `#/checkout/${hold.eventId}`;
  pill.classList.toggle("is-urgent", remaining <= 60000);
  clock.textContent = formatCountdown(remaining);
}

function renderRoute() {
  if (typeof cleanupCurrentPage === "function") {
    cleanupCurrentPage();
    cleanupCurrentPage = null;
  }

  const { path, query } = parseHash();
  renderShell(path);

  const pageRoot = document.getElementById("vn-page-root");
  const ctx = {
    navigate,
    refreshShell: () => {
      const { path: p } = parseHash();
      // Preserve current page content while refreshing header/mode if needed
      const currentMain = document.getElementById("vn-page-root");
      if (!currentMain) return;
      // Re-render route cleanly when shell state changes (login/logout/mode)
      syncGlobalHoldPill();
      updateHeaderAuth(p);
      renderModeStrip();
    }
  };

  let match;
  if (path === "/" || path === "/events") {
    document.title = "Vé Nhà — Sự kiện & đặt vé thời gian thực";
    cleanupCurrentPage = renderEventsPage(pageRoot, ctx);
  } else if ((match = path.match(/^\/events\/(\d+)$/))) {
    document.title = "Chi tiết sự kiện | Vé Nhà";
    cleanupCurrentPage = renderEventDetailPage(pageRoot, ctx, match[1]);
  } else if ((match = path.match(/^\/events\/(\d+)\/seats$/))) {
    document.title = "Chọn ghế | Vé Nhà";
    cleanupCurrentPage = renderSeatmapPage(pageRoot, ctx, match[1]);
  } else if ((match = path.match(/^\/checkout\/(\d+)$/))) {
    document.title = "Xác nhận đặt vé | Vé Nhà";
    cleanupCurrentPage = renderCheckoutPage(pageRoot, ctx, match[1]);
  } else if (path === "/tickets") {
    document.title = "Vé đã đặt | Vé Nhà";
    cleanupCurrentPage = renderTicketsPage(pageRoot, ctx, query);
  } else if (path === "/login") {
    document.title = "Đăng nhập | Vé Nhà";
    cleanupCurrentPage = renderAuthPage(pageRoot, ctx, "login", query);
  } else if (path === "/register") {
    document.title = "Đăng ký | Vé Nhà";
    cleanupCurrentPage = renderAuthPage(pageRoot, ctx, "register", query);
  } else if (path === "/profile") {
    document.title = "Tài khoản | Vé Nhà";
    cleanupCurrentPage = renderProfilePage(pageRoot, ctx);
  } else {
    document.title = "Không tìm thấy trang | Vé Nhà";
    pageRoot.innerHTML = `
      <section class="vn-state-box">
        <h1>Không tìm thấy trang bạn yêu cầu</h1>
        <p>Đường dẫn không tồn tại hoặc đã được thay đổi.</p>
        <div class="vn-state-actions">
          <a href="#/events" class="vn-btn vn-btn-primary">Về trang sự kiện</a>
        </div>
      </section>
    `;
  }

  syncGlobalHoldPill();
  document.getElementById("vn-main")?.focus({ preventScroll: true });
}

function updateHeaderAuth(activePath) {
  const actionsEl = document.querySelector(".vn-header-actions");
  if (!actionsEl) return;
  const session = getSession();
  const hold = getActiveHold();
  actionsEl.innerHTML = `
    <a
      href="${hold ? `#/checkout/${hold.eventId}` : "#/events"}"
      class="vn-hold-pill"
      id="vn-global-hold-pill"
      style="${hold ? "" : "display:none;"}"
      title="Hoàn tất xác nhận các ghế đang giữ"
    >
      ${icons.clock(14)}
      <span>Giữ ${hold ? hold.seats.length : 0} ghế</span>
      <span class="vn-mono" id="vn-global-hold-clock">
        ${hold ? formatCountdown(hold.expiresAt - Date.now()) : "05:00"}
      </span>
    </a>
    ${
      session
        ? `
          <a href="#/profile" class="vn-user-chip" ${
            activePath === "/profile" ? 'aria-current="page"' : ""
          }>
            <span class="vn-user-avatar" aria-hidden="true">${escapeHtml(initialsOf(session.user.fullName))}</span>
            <span>${escapeHtml(session.user.fullName)}</span>
          </a>
        `
        : `
          <a href="#/login" class="vn-btn vn-btn-secondary vn-btn-sm">Đăng nhập</a>
          <a href="#/register" class="vn-btn vn-btn-primary vn-btn-sm">Đăng ký</a>
        `
    }
  `;
}

window.addEventListener("hashchange", renderRoute);

// Allow quick mode switching via ?demo=1 or ?demo=0 for presentations & testing
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get("demo") === "1" && getMode() !== "demo") {
  setMode("demo");
} else if (searchParams.get("demo") === "0" && getMode() !== "live") {
  setMode("live");
}

if (!window.location.hash) {
  window.location.replace("#/events");
}
renderRoute();

globalHoldInterval = window.setInterval(syncGlobalHoldPill, 1000);
window.addEventListener("beforeunload", () => {
  window.clearInterval(globalHoldInterval);
});
