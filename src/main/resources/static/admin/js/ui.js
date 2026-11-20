export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function formatDate(value, options = {}) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Thời gian không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options
  }).format(date);
}

export function notify(message, type = "success") {
  const region = document.querySelector("#adm-notices");
  if (!region) return;
  const notice = document.createElement("div");
  notice.className = `adm-notice${type === "error" ? " adm-notice-error" : ""}`;
  notice.setAttribute("role", type === "error" ? "alert" : "status");
  notice.textContent = message;
  region.append(notice);
  window.setTimeout(() => notice.remove(), 3500);
}

export function renderPageHeading(title, description = "", actions = "") {
  return `<header class="adm-page-heading">
    <div><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</div>
    ${actions ? `<div class="adm-page-actions">${actions}</div>` : ""}
  </header>`;
}

export function renderEmptyState(title, message) {
  return `<section class="adm-empty" aria-label="${escapeHtml(title)}">
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(message)}</p>
  </section>`;
}