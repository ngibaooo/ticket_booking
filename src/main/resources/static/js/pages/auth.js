import { api, clearActiveHold, clearSession, getMode, getSession } from "../api.js";
import { icons } from "../icons.js";
import { escapeHtml, formatDateTime, showNotice } from "../ui.js";

export function renderAuthPage(container, ctx, mode, queryParams) {
  const isRegister = mode === "register";
  const nextRoute = queryParams?.get("next") || "#/events";
  let busy = false;
  let formError = "";
  let fieldErrors = {};

  function render() {
    const isDemo = getMode() === "demo";

    container.innerHTML = `
      <section class="vn-auth-shell" aria-labelledby="vn-auth-title">
        <div class="vn-auth-tabs" role="tablist">
          <a
            href="#/login${queryParams?.get("next") ? `?next=${encodeURIComponent(nextRoute)}` : ""}"
            class="vn-auth-tab ${!isRegister ? "is-active" : ""}"
            role="tab"
            aria-selected="${!isRegister ? "true" : "false"}"
          >Đăng nhập</a>
          <a
            href="#/register${queryParams?.get("next") ? `?next=${encodeURIComponent(nextRoute)}` : ""}"
            class="vn-auth-tab ${isRegister ? "is-active" : ""}"
            role="tab"
            aria-selected="${isRegister ? "true" : "false"}"
          >Đăng ký</a>
        </div>

        <h1 id="vn-auth-title" style="font-size:24px;font-weight:800;margin-bottom:6px;">
          ${isRegister ? "Tạo tài khoản khách hàng" : "Đăng nhập Vé Nhà"}
        </h1>
        <p class="vn-section-sub" style="margin-bottom:20px;">
          ${
            isRegister
              ? "Đăng ký để giữ ghế thời gian thực 5 phút và quản lý vé QR của bạn."
              : "Đăng nhập để tiếp tục chọn ghế, xác nhận đặt vé và xem mã QR."
          }
        </p>

        ${
          formError
            ? `<div class="vn-notice-box" role="alert" style="margin-bottom:16px;background:var(--vn-danger-soft);border-color:var(--vn-danger-border);color:var(--vn-danger);">${icons.x(16)}<span>${escapeHtml(formError)}</span></div>`
            : ""
        }

        <form id="vn-auth-form" class="vn-form-stack" novalidate>
          ${
            isRegister
              ? `
                <div class="vn-field">
                  <label class="vn-label" for="vn-full-name">Họ và tên</label>
                  <input id="vn-full-name" class="vn-input" name="fullName" type="text" required maxlength="100" autocomplete="name" placeholder="Nguyễn Văn An">
                  ${fieldErrors.fullName ? `<span class="vn-field-error">${escapeHtml(fieldErrors.fullName)}</span>` : ""}
                </div>
              `
              : ""
          }

          <div class="vn-field">
            <label class="vn-label" for="vn-email">Địa chỉ email</label>
            <input id="vn-email" class="vn-input" name="email" type="email" required maxlength="150" autocomplete="email" placeholder="ban@example.com">
            ${fieldErrors.email ? `<span class="vn-field-error">${escapeHtml(fieldErrors.email)}</span>` : ""}
          </div>

          ${
            isRegister
              ? `
                <div class="vn-field">
                  <label class="vn-label" for="vn-phone">Số điện thoại</label>
                  <input id="vn-phone" class="vn-input vn-mono" name="phone" type="tel" maxlength="20" autocomplete="tel" placeholder="0901234567">
                  <span class="vn-field-hint">10 chữ số, bắt đầu bằng số 0</span>
                  ${fieldErrors.phone ? `<span class="vn-field-error">${escapeHtml(fieldErrors.phone)}</span>` : ""}
                </div>
              `
              : ""
          }

          <div class="vn-field">
            <label class="vn-label" for="vn-password">Mật khẩu</label>
            <input id="vn-password" class="vn-input" name="password" type="password" required minlength="${isRegister ? "8" : "1"}" maxlength="72" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="${isRegister ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu"}">
            ${fieldErrors.password ? `<span class="vn-field-error">${escapeHtml(fieldErrors.password)}</span>` : ""}
          </div>

          <button type="submit" class="vn-btn vn-btn-primary vn-btn-lg vn-btn-full" ${busy ? "disabled" : ""}>
            ${
              busy
                ? "Đang xử lý..."
                : isRegister
                ? "Đăng ký & đăng nhập"
                : "Đăng nhập"
            }
          </button>

          ${
            !isRegister && isDemo
              ? `
                <button type="button" class="vn-btn vn-btn-secondary vn-btn-full" data-action="fill-demo">
                  Điền nhanh tài khoản mẫu (khachhang@venha.vn)
                </button>
              `
              : ""
          }
        </form>
      </section>
    `;

    container.querySelector("[data-action='fill-demo']")?.addEventListener("click", () => {
      const emailEl = container.querySelector("#vn-email");
      const passEl = container.querySelector("#vn-password");
      if (emailEl) emailEl.value = "khachhang@venha.vn";
      if (passEl) passEl.value = "Password123";
    });

    const form = container.querySelector("#vn-auth-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");
      const fullName = String(fd.get("fullName") || "").trim();
      const phone = String(fd.get("phone") || "").trim();

      fieldErrors = {};
      formError = "";

      if (isRegister && !fullName) fieldErrors.fullName = "Vui lòng nhập họ và tên.";
      if (!email || !email.includes("@")) fieldErrors.email = "Email chưa đúng định dạng.";
      if (!password) fieldErrors.password = "Vui lòng nhập mật khẩu.";
      else if (isRegister && password.length < 8) {
        fieldErrors.password = "Mật khẩu phải có từ 8 đến 72 ký tự.";
      }
      if (isRegister && phone && !/^0[0-9]{9}$/.test(phone)) {
        fieldErrors.phone = "Số điện thoại cần gồm đúng 10 chữ số bắt đầu bằng 0.";
      }

      if (Object.keys(fieldErrors).length > 0) {
        render();
        return;
      }

      busy = true;
      render();
      try {
        if (isRegister) {
          await api.register({ fullName, email, password, phone });
          await api.login({ email, password });
          showNotice("Đăng ký thành công! Chào mừng bạn đến với Vé Nhà.", "success");
        } else {
          await api.login({ email, password });
          showNotice("Đăng nhập thành công.", "success");
        }
        ctx.refreshShell();
        ctx.navigate(nextRoute);
      } catch (err) {
        formError = err.message;
        fieldErrors = err.validationErrors || {};
        busy = false;
        render();
      }
    });
  }

  render();
  return () => {};
}

export function renderProfilePage(container, ctx) {
  let destroyed = false;
  let user = getSession()?.user || null;
  let busy = false;
  let fieldErrors = {};

  async function init() {
    if (!getSession()) {
      ctx.navigate(`#/login?next=${encodeURIComponent("#/profile")}`);
      return;
    }
    render();
    try {
      const fresh = await api.getCurrentUser();
      if (destroyed) return;
      user = fresh;
      ctx.refreshShell();
      render();
    } catch {
      // Keep cached user info
    }
  }

  function render() {
    if (!user) return;
    container.innerHTML = `
      <div class="vn-section-head">
        <div>
          <h1 class="vn-section-title">Tài khoản cá nhân</h1>
          <p class="vn-section-sub">Quản lý thông tin liên hệ hiển thị trên đơn đặt vé của bạn.</p>
        </div>
      </div>

      <div class="vn-profile-grid">
        <section class="vn-panel" aria-labelledby="vn-acc-info">
          <h2 id="vn-acc-info" class="vn-panel-title">Thông tin tài khoản</h2>
          <div class="vn-kv-list">
            <div class="vn-kv-row">
              <span class="vn-kv-label">Email đăng nhập</span>
              <span class="vn-kv-value">${escapeHtml(user.email)}</span>
            </div>
            <div class="vn-kv-row">
              <span class="vn-kv-label">Vai trò</span>
              <span class="vn-kv-value"><span class="vn-badge vn-badge-open">${escapeHtml(user.role || "CUSTOMER")}</span></span>
            </div>
            <div class="vn-kv-row">
              <span class="vn-kv-label">Trạng thái</span>
              <span class="vn-kv-value">${escapeHtml(user.status || "ACTIVE")}</span>
            </div>
            <div class="vn-kv-row">
              <span class="vn-kv-label">Ngày tạo</span>
              <span class="vn-kv-value vn-tabular">${escapeHtml(formatDateTime(user.createdAt))}</span>
            </div>
          </div>

          <div style="margin-top:20px;">
            <button type="button" class="vn-btn vn-btn-danger-outline vn-btn-full" data-action="logout">
              ${icons.logout(16)} Đăng xuất
            </button>
          </div>
        </section>

        <section class="vn-panel" aria-labelledby="vn-acc-edit">
          <h2 id="vn-acc-edit" class="vn-panel-title">Cập nhật hồ sơ</h2>
          <form id="vn-profile-form" class="vn-form-stack" novalidate>
            <div class="vn-field">
              <label class="vn-label" for="vn-pf-name">Họ và tên</label>
              <input id="vn-pf-name" class="vn-input" name="fullName" type="text" required maxlength="100" value="${escapeHtml(user.fullName || "")}">
              ${fieldErrors.fullName ? `<span class="vn-field-error">${escapeHtml(fieldErrors.fullName)}</span>` : ""}
            </div>

            <div class="vn-field">
              <label class="vn-label" for="vn-pf-phone">Số điện thoại</label>
              <input id="vn-pf-phone" class="vn-input vn-mono" name="phone" type="tel" maxlength="10" value="${escapeHtml(user.phone || "")}" placeholder="0901234567">
              <span class="vn-field-hint">Đúng 10 chữ số, bắt đầu bằng 0 (ví dụ: 0901234567)</span>
              ${fieldErrors.phone ? `<span class="vn-field-error">${escapeHtml(fieldErrors.phone)}</span>` : ""}
            </div>

            <button type="submit" class="vn-btn vn-btn-primary" ${busy ? "disabled" : ""}>
              ${busy ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>
      </div>
    `;

    container.querySelector("[data-action='logout']")?.addEventListener("click", () => {
      clearSession();
      clearActiveHold();
      showNotice("Đã đăng xuất tài khoản.", "info");
      ctx.refreshShell();
      ctx.navigate("#/events");
    });

    const form = container.querySelector("#vn-profile-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const fd = new FormData(form);
      const fullName = String(fd.get("fullName") || "").trim();
      const phone = String(fd.get("phone") || "").trim();

      fieldErrors = {};
      if (!fullName) fieldErrors.fullName = "Họ và tên không được để trống.";
      if (!/^0[0-9]{9}$/.test(phone)) {
        fieldErrors.phone = "Số điện thoại phải gồm đúng 10 chữ số bắt đầu bằng 0.";
      }
      if (Object.keys(fieldErrors).length > 0) {
        render();
        return;
      }

      busy = true;
      render();
      try {
        user = await api.updateProfile({ fullName, phone });
        showNotice("Đã cập nhật thông tin cá nhân.", "success");
        ctx.refreshShell();
      } catch (err) {
        fieldErrors = err.validationErrors || {};
        showNotice(err.message, "danger");
      } finally {
        busy = false;
        if (!destroyed) render();
      }
    });
  }

  init();
  return () => {
    destroyed = true;
  };
}
