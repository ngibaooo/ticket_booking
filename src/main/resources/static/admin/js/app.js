import { getSession, signOut } from "./api.js";
import { renderLogin, mountLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderVenues } from "./pages/venues.js";
import { renderSeatMap } from "./pages/seatmap.js";
import { renderEvents } from "./pages/events.js";
import { renderBookings } from "./pages/bookings.js";
import { escapeHtml } from "./ui.js";

const app = document.querySelector("#adm-app");

const pages = {
  dashboard: { title: "Tổng quan", render: renderDashboard },
  venues: { title: "Địa điểm", render: renderVenues },
  seatmap: { title: "Sơ đồ ghế", render: renderSeatMap },
  events: { title: "Sự kiện", render: renderEvents },
  bookings: { title: "Đặt vé", render: renderBookings }
};

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, "") || "dashboard";
}

function shell(content, route, session) {
  const nav = [
    ["dashboard", "Tổng quan", "T"],
    ["venues", "Địa điểm", "Đ"],
    ["events", "Sự kiện", "S"],
    ["bookings", "Đặt vé", "V"]
  ];
  return `<div class="adm-shell">
    <aside class="adm-sidebar" aria-label="Điều hướng quản trị">
      <a class="adm-brand" href="#/dashboard" aria-label="Vé Nhà, trang tổng quan">
        <span class="adm-brand-mark" aria-hidden="true">VN</span><span>Vé Nhà</span>
      </a>
      <nav class="adm-nav">
        ${nav.map(([key, label, mark]) => `<a class="adm-nav-link" href="#/${key}"${route === key ? ' aria-current="page"' : ""}>
          <span class="adm-nav-key" aria-hidden="true">${mark}</span><span>${label}</span>
        </a>`).join("")}
      </nav>
      <div class="adm-sidebar-bottom">
        <a class="adm-nav-link" href="#/seatmap"><span class="adm-nav-key" aria-hidden="true">G</span><span>Sơ đồ ghế</span></a>
      </div>
    </aside>
    <main class="adm-main">
      <header class="adm-topbar">
        <span class="adm-topbar-title">${escapeHtml(pages[route]?.title || "Quản trị")}</span>
        <div class="adm-user-area"><span class="adm-user-name">${escapeHtml(session.name || session.email)}</span>
          <button class="adm-button adm-button-quiet" type="button" data-adm-sign-out>Đăng xuất</button>
        </div>
      </header>
      <section class="adm-page">${content}</section>
    </main>
  </div>`;
}

function render() {
  const route = currentRoute();
  const session = getSession();

  if (route === "login" && session) {
    window.location.replace("#/dashboard");
    return;
  }

  if (route === "login" || !session) {
    if (route !== "login") window.location.replace("#/login");
    app.innerHTML = renderLogin();
    mountLogin();
    return;
  }

  if (!pages[route]) {
    window.location.hash = "#/dashboard";
    return;
  }

  app.innerHTML = shell(pages[route].render(), route, session);
  app.querySelector("[data-adm-sign-out]").addEventListener("click", () => {
    signOut();
    window.location.replace("#/login");
  });
}

window.addEventListener("hashchange", render);
render();