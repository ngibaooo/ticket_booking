import { renderEmptyState, renderPageHeading } from "../ui.js";

export function renderVenues() {
  return `${renderPageHeading("Địa điểm", "")}
    ${renderEmptyState("Chưa có danh sách địa điểm", "Địa điểm mẫu sẽ được nạp khi màn hình quản lý được hoàn thiện.")}`;
}