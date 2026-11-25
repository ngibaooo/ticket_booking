import { api, getMode, setMode } from "../api.js";
import { icons } from "../icons.js";
import {
  escapeHtml,
  eventStatusMeta,
  fallbackBannerFor,
  formatDateTime,
  resolveBanner,
  showNotice
} from "../ui.js";

const state = {
  keyword: "",
  status: "",
  venueId: "",
  sort: "startTime,ASC",
  page: 0,
  size: 9
};

export function renderEventsPage(container, ctx) {
  let destroyed = false;
  let venues = [];

  async function load() {
    container.innerHTML = renderSkeleton();
    const [sortBy, direction] = state.sort.split(",");
    try {
      const [pageData, venueList] = await Promise.all([
        api.getEvents({
          keyword: state.keyword,
          status: state.status,
          venueId: state.venueId,
          page: state.page,
          size: state.size,
          sortBy,
          direction
        }),
        venues.length > 0 ? Promise.resolve(venues) : api.getVenues()
      ]);
      if (destroyed) return;
      venues = Array.isArray(venueList) ? venueList : [];
      renderContent(pageData);
    } catch (err) {
      if (destroyed) return;
      container.innerHTML = `
        <section class="vn-state-box" role="alert">
          <h2>Không thể tải danh sách sự kiện</h2>
          <p>${escapeHtml(err.message)}</p>
          <div class="vn-state-actions">
            <button type="button" class="vn-btn vn-btn-primary" data-action="retry">
              ${icons.refresh(16)} Thử lại
            </button>
            ${
              getMode() === "live"
                ? `<button type="button" class="vn-btn vn-btn-secondary" data-action="switch-demo">Bật dữ liệu mẫu để xem thử</button>`
                : ""
            }
          </div>
        </section>
      `;
      bindFallbackActions();
    }
  }

  function renderContent(pageData) {
    const items = Array.isArray(pageData?.content) ? pageData.content : [];
    const totalElements = pageData?.totalElements ?? items.length;
    const totalPages = pageData?.totalPages ?? 1;
    const currentPage = pageData?.number ?? state.page;
    const isFiltered = Boolean(state.keyword.trim() || state.status || state.venueId);

    // First open event becomes spotlight on unfiltered first page
    const spotlight =
      !isFiltered && currentPage === 0
        ? items.find((e) => e.status === "OPEN") || items[0] || null
        : null;

    const listItems = spotlight
      ? items.filter((e) => e.id !== spotlight.id)
      : items;

    container.innerHTML = `
      ${spotlight ? renderSpotlight(spotlight) : ""}

      <section aria-labelledby="vn-catalog-heading">
        <div class="vn-section-head">
          <div>
            <h1 id="vn-catalog-heading" class="vn-section-title">
              ${spotlight ? "Sự kiện đang và sắp diễn ra" : "Danh sách sự kiện"}
            </h1>
            <p class="vn-section-sub vn-tabular">
              ${totalElements} sự kiện khả dụng — chọn chỗ trực tiếp theo sơ đồ ghế thời gian thực
            </p>
          </div>
        </div>

        <form class="vn-toolbar ${venues.length > 0 ? "has-venue" : ""}" id="vn-events-filter" role="search">
          <div class="vn-search-wrap">
            ${icons.search(16)}
            <label class="vn-sr-only" for="vn-search-input">Tìm kiếm sự kiện</label>
            <input
              id="vn-search-input"
              class="vn-input"
              type="search"
              name="keyword"
              maxlength="100"
              placeholder="Tìm tên sự kiện..."
              value="${escapeHtml(state.keyword)}"
            >
          </div>

          ${
            venues.length > 0
              ? `
                <div>
                  <label class="vn-sr-only" for="vn-venue-select">Lọc theo địa điểm</label>
                  <select id="vn-venue-select" class="vn-select" name="venueId">
                    <option value="" ${state.venueId === "" ? "selected" : ""}>Tất cả địa điểm</option>
                    ${venues
                      .map(
                        (v) =>
                          `<option value="${v.id}" ${
                            String(state.venueId) === String(v.id) ? "selected" : ""
                          }>${escapeHtml(v.venueName)}</option>`
                      )
                      .join("")}
                  </select>
                </div>
              `
              : ""
          }

          <div>
            <label class="vn-sr-only" for="vn-status-select">Lọc theo trạng thái</label>
            <select id="vn-status-select" class="vn-select" name="status">
              <option value="" ${state.status === "" ? "selected" : ""}>Tất cả trạng thái</option>
              <option value="OPEN" ${state.status === "OPEN" ? "selected" : ""}>Đang mở bán</option>
              <option value="UPCOMING" ${state.status === "UPCOMING" ? "selected" : ""}>Sắp mở bán</option>
              <option value="CLOSED" ${state.status === "CLOSED" ? "selected" : ""}>Đã đóng bán</option>
              <option value="COMPLETED" ${state.status === "COMPLETED" ? "selected" : ""}>Đã kết thúc</option>
            </select>
          </div>

          <div>
            <label class="vn-sr-only" for="vn-sort-select">Sắp xếp</label>
            <select id="vn-sort-select" class="vn-select" name="sort">
              <option value="startTime,ASC" ${state.sort === "startTime,ASC" ? "selected" : ""}>Diễn ra sớm nhất</option>
              <option value="startTime,DESC" ${state.sort === "startTime,DESC" ? "selected" : ""}>Diễn ra muộn nhất</option>
              <option value="eventName,ASC" ${state.sort === "eventName,ASC" ? "selected" : ""}>Tên A → Z</option>
              <option value="createdAt,DESC" ${state.sort === "createdAt,DESC" ? "selected" : ""}>Mới cập nhật</option>
            </select>
          </div>

          <button type="submit" class="vn-btn vn-btn-primary">Lọc</button>
        </form>

        ${
          items.length === 0
            ? renderEmpty(isFiltered)
            : `
              <div class="vn-events-grid">
                ${(listItems.length > 0 ? listItems : items).map(renderCard).join("")}
              </div>
              ${renderPagination(currentPage, totalPages, totalElements)}
            `
        }
      </section>
    `;

    // Attach image fallback safely without inline handlers
    container.querySelectorAll("img[data-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = "1";
        img.src = img.dataset.fallback;
      });
    });

    const form = container.querySelector("#vn-events-filter");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      state.keyword = String(fd.get("keyword") || "");
      state.venueId = String(fd.get("venueId") || "");
      state.status = String(fd.get("status") || "");
      state.sort = String(fd.get("sort") || "startTime,ASC");
      state.page = 0;
      load();
    });

    form?.querySelector("#vn-venue-select")?.addEventListener("change", () => {
      form.requestSubmit();
    });
    form?.querySelector("#vn-status-select")?.addEventListener("change", () => {
      form.requestSubmit();
    });
    form?.querySelector("#vn-sort-select")?.addEventListener("change", () => {
      form.requestSubmit();
    });

    container.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = Number(btn.dataset.page);
        if (!Number.isNaN(next) && next >= 0) {
          state.page = next;
          load();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });

    container.querySelector("[data-action='reset-filters']")?.addEventListener("click", () => {
      state.keyword = "";
      state.venueId = "";
      state.status = "";
      state.sort = "startTime,ASC";
      state.page = 0;
      load();
    });

    bindFallbackActions();
  }

  function bindFallbackActions() {
    container.querySelector("[data-action='retry']")?.addEventListener("click", load);
    container.querySelector("[data-action='switch-demo']")?.addEventListener("click", () => {
      setMode("demo");
      showNotice("Đã bật chế độ dữ liệu mẫu — sẵn sàng trải nghiệm toàn bộ luồng đặt vé.", "success");
      ctx.refreshShell();
      load();
    });
  }

  load();
  return () => {
    destroyed = true;
  };
}

function renderSpotlight(ev) {
  const st = eventStatusMeta(ev.status);
  const canBook = ev.status === "OPEN";
  return `
    <article class="vn-spotlight" aria-label="Sự kiện nổi bật">
      <div class="vn-spotlight-media">
        <img
          src="${escapeHtml(resolveBanner(ev))}"
          data-fallback="${escapeHtml(fallbackBannerFor(ev))}"
          alt="Hình ảnh sự kiện ${escapeHtml(ev.eventName)}"
        >
      </div>
      <div class="vn-spotlight-body">
        <div>
          <span class="vn-badge ${st.cls}">${escapeHtml(st.label)}</span>
          <h2 class="vn-spotlight-title">${escapeHtml(ev.eventName)}</h2>
          <p class="vn-spotlight-desc">${escapeHtml(
            (ev.description || "").split("\n")[0] ||
              "Chọn vị trí ngồi trực tiếp theo sơ đồ khán phòng và nhận vé QR ngay sau khi xác nhận."
          )}</p>

          <div class="vn-meta-list">
            <div class="vn-meta-row">
              ${icons.calendar(16)}
              <span class="vn-tabular">${escapeHtml(formatDateTime(ev.startTime))}</span>
            </div>
            <div class="vn-meta-row">
              ${icons.pin(16)}
              <span>${escapeHtml(ev.venueName || "Đang cập nhật địa điểm")}</span>
            </div>
          </div>
        </div>

        <div class="vn-spotlight-actions">
          <a
            href="#/events/${ev.id}/seats"
            class="vn-btn vn-btn-primary vn-btn-lg"
          >
            ${canBook ? "Chọn ghế ngay" : "Xem sơ đồ ghế"}
            ${icons.arrowRight(16)}
          </a>
          <a href="#/events/${ev.id}" class="vn-btn vn-btn-secondary vn-btn-lg">
            Chi tiết sự kiện
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderCard(ev) {
  const st = eventStatusMeta(ev.status);
  const canBook = ev.status === "OPEN";
  return `
    <article class="vn-event-card">
      <a href="#/events/${ev.id}" class="vn-event-thumb" tabindex="-1" aria-hidden="true">
        <img
          src="${escapeHtml(resolveBanner(ev))}"
          data-fallback="${escapeHtml(fallbackBannerFor(ev))}"
          alt=""
          loading="lazy"
        >
        <span class="vn-badge ${st.cls} vn-event-thumb-badge">${escapeHtml(st.label)}</span>
      </a>
      <div class="vn-event-body">
        <h2 class="vn-event-title">
          <a href="#/events/${ev.id}">${escapeHtml(ev.eventName)}</a>
        </h2>
        <div class="vn-event-info">
          <div class="vn-event-info-item">
            ${icons.calendar(15)}
            <span class="vn-tabular">${escapeHtml(formatDateTime(ev.startTime))}</span>
          </div>
          <div class="vn-event-info-item">
            ${icons.pin(15)}
            <span>${escapeHtml(ev.venueName || "Đang cập nhật")}</span>
          </div>
        </div>
        <div class="vn-event-foot">
          <a href="#/events/${ev.id}" class="vn-btn vn-btn-ghost vn-btn-sm">Xem chi tiết</a>
          <a href="#/events/${ev.id}/seats" class="vn-btn ${
            canBook ? "vn-btn-primary" : "vn-btn-secondary"
          } vn-btn-sm">
            ${canBook ? "Chọn ghế" : "Sơ đồ ghế"}
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderPagination(currentPage, totalPages, totalElements) {
  if (totalPages <= 1) return "";
  return `
    <nav class="vn-pagination" aria-label="Phân trang sự kiện">
      <span class="vn-section-sub vn-tabular">
        Trang ${currentPage + 1} / ${totalPages} (${totalElements} sự kiện)
      </span>
      <div class="vn-spotlight-actions">
        <button
          type="button"
          class="vn-btn vn-btn-secondary vn-btn-sm"
          data-page="${currentPage - 1}"
          ${currentPage <= 0 ? "disabled" : ""}
        >
          ${icons.arrowLeft(15)} Trang trước
        </button>
        <button
          type="button"
          class="vn-btn vn-btn-secondary vn-btn-sm"
          data-page="${currentPage + 1}"
          ${currentPage >= totalPages - 1 ? "disabled" : ""}
        >
          Trang sau ${icons.arrowRight(15)}
        </button>
      </div>
    </nav>
  `;
}

function renderEmpty(isFiltered) {
  if (isFiltered) {
    return `
      <div class="vn-state-box">
        <h2>Không tìm thấy sự kiện phù hợp</h2>
        <p>Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái để xem toàn bộ sự kiện.</p>
        <div class="vn-state-actions">
          <button type="button" class="vn-btn vn-btn-secondary" data-action="reset-filters">
            Xóa bộ lọc
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="vn-state-box">
      <h2>Chưa có sự kiện nào trong cơ sở dữ liệu</h2>
      <p>
        Backend PostgreSQL hiện chưa có sự kiện nào ở trạng thái công khai. Bạn có thể tạo sự kiện từ trang Quản trị hoặc bật <strong>chế độ dữ liệu mẫu</strong> để trải nghiệm ngay quy trình chọn ghế, giữ chỗ 5 phút và xuất vé QR.
      </p>
      <div class="vn-state-actions">
        <button type="button" class="vn-btn vn-btn-primary" data-action="switch-demo">
          Bật dữ liệu mẫu để trải nghiệm
        </button>
        <button type="button" class="vn-btn vn-btn-secondary" data-action="retry">
          ${icons.refresh(16)} Tải lại từ Backend
        </button>
      </div>
    </div>
  `;
}

function renderSkeleton() {
  return `
    <div class="vn-skeleton" style="height:340px;margin-bottom:32px;border-radius:14px;"></div>
    <div class="vn-events-grid">
      <div class="vn-skeleton" style="height:310px;border-radius:10px;"></div>
      <div class="vn-skeleton" style="height:310px;border-radius:10px;"></div>
      <div class="vn-skeleton" style="height:310px;border-radius:10px;"></div>
    </div>
  `;
}
