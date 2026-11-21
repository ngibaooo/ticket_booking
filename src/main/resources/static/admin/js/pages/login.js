import { signInDemo } from "../api.js";
import { notify, escapeHtml } from "../ui.js";

export function renderLogin() {
  return `<main class="adm-login-page" id="adm-main-content">
    <section class="adm-login-panel" aria-labelledby="adm-login-title">
      <a class="adm-brand" href="#/login" aria-label="Vé Nhà">
        <span class="adm-brand-mark" aria-hidden="true">VN</span><span>Vé Nhà</span>
      </a>
      <h1 id="adm-login-title">Đăng nhập quản trị</h1>
      <p>Nhập tài khoản thử để mở giao diện quản trị.</p>
      <form class="adm-login-fields" id="adm-login-form" novalidate>
        <div class="adm-field">
          <label for="adm-email">Email</label>
          <input id="adm-email" name="email" type="email" autocomplete="username" inputmode="email" aria-describedby="adm-login-error">
        </div>
        <div class="adm-field">
          <label for="adm-password">Mật khẩu</label>
          <div class="adm-password-wrap">
            <input id="adm-password" name="password" type="password" autocomplete="current-password" aria-describedby="adm-login-error">
            <button class="adm-password-toggle" type="button" data-adm-password-toggle aria-label="Hiện mật khẩu">Hiện</button>
          </div>
        </div>
        <p class="adm-login-error" id="adm-login-error" aria-live="polite"></p>
        <button class="adm-button adm-button-primary" type="submit" data-adm-login-submit>Đăng nhập</button>
      </form>
      <p class="adm-login-note">Tài khoản thử: <span class="adm-mono">admin@example.test</span> / <span class="adm-mono">demo1234</span></p>
      <p class="adm-login-note">Chế độ mô phỏng: chưa xác thực bằng backend.</p>
    </section>
  </main>`;
}

export function mountLogin() {
  const form = document.querySelector("#adm-login-form");
  if (!form) return;

  const email = document.querySelector("#adm-email");
  const password = document.querySelector("#adm-password");
  const error = document.querySelector("#adm-login-error");
  const submit = document.querySelector("[data-adm-login-submit]");
  const passwordToggle = document.querySelector("[data-adm-password-toggle]");

  passwordToggle.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    passwordToggle.textContent = showing ? "Hiện" : "Ẩn";
    passwordToggle.setAttribute("aria-label", showing ? "Hiện mật khẩu" : "Ẩn mật khẩu");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    error.textContent = "";
    email.removeAttribute("aria-invalid");
    password.removeAttribute("aria-invalid");

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    if (!emailValue) {
      email.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập email quản trị.";
      email.focus();
      return;
    }

    if (!email.validity.valid) {
      email.setAttribute("aria-invalid", "true");
      error.textContent = "Email chưa đúng định dạng, ví dụ: admin@example.test.";
      email.focus();
      return;
    }

    if (!passwordValue) {
      password.setAttribute("aria-invalid", "true");
      error.textContent = "Nhập mật khẩu.";
      password.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Đang đăng nhập…";

    try {
      await signInDemo(emailValue, passwordValue);
      notify("Đã đăng nhập vào phần quản trị.");
      window.location.replace("#/dashboard");
    } catch (reason) {
      email.setAttribute("aria-invalid", "true");
      password.setAttribute("aria-invalid", "true");
      error.textContent = "Email hoặc mật khẩu không đúng. Dùng tài khoản thử trong phần ghi chú.";
      notify(reason.message || "Không thể đăng nhập.", "error");
      password.select();
    } finally {
      submit.disabled = false;
      submit.textContent = "Đăng nhập";
    }
  });
}