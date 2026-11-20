import { renderEmptyState, renderPageHeading } from "../ui.js";

export function renderEvents() {
  return `${renderPageHeading("Sự kiện", "")}
    ${renderEmptyState("Chưa có danh sách sự kiện", "Sự kiện mẫu sẽ được nạp khi màn hình quản lý được hoàn thiện.")}`;
}