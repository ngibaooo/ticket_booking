import { signInDemo } from "../api.js";
import { notify, escapeHtml } from "../ui.js";

export function renderLogin() {
  return `<main class="adm-login-page">
    <section class="adm-login-panel" aria-labelledby="adm-login-title">
      <a class="adm-brand" href="#/login" aria-label="Vé Nhà">
        <span class="adm-brand-mark" aria-hidden="true">VN</span><span>Vé Nhà</span>
      </a>
      <h1 id="adm-login-title">Đăng nhập quản trị</h1>
      <p>Đăng nhập bằng tài khoản thử để xem khung quản trị.</p>
      <form class="adm-login-fields" id="adm-login-form" novalidate>
        <div class="adm-field"><label for="adm-email">Email</label><input id="adm-email" name="email" type="email" autocomplete="username" value="admin@example.test"></div>
        <div class="adm-field"><label for="adm-password">Mật khẩu</label><input id="adm-password" name="password" type="password" autocomplete="current-password" value="demo1234"></div>
        <p class="adm-login-error" id="adm-login-error" aria-live="polite"></p>
        <button class="adm-button adm-button-primary" type="submit">Đăng nhập</button>
      </form>
      <p class="adm-login-note">Tài khoản thử: <span class="adm-mono">admin@example.test</span> / <span class="adm-mono">demo1234</span></p>
      <p class="adm-login-note">Đây là dữ liệu mẫu, chưa xác thực với backend.</p>
    </section>
  </main>`;
}

export function mountLogin() {
  const form = document.querySelector("#adm-login-form");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = new FormData(form);
    const error = document.querySelector("#adm-login-error");
    error.textContent = "";
    try {
      await signInDemo(String(values.get("email") || "").trim(), String(values.get("password") || ""));
      window.location.hash = "#/dashboard";
    } catch (reason) {
      error.textContent = escapeHtml(reason.message || "Không thể đăng nhập.");
      notify("Kiểm tra lại email và mật khẩu tài khoản thử.", "error");
    }
  });
}