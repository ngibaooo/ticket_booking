import { renderEmptyState, renderPageHeading } from "../ui.js";

export function renderBookings() {
  return `${renderPageHeading("Đặt vé", "")}
    ${renderEmptyState("Chưa có đơn đặt vé", "Đơn đặt vé mẫu sẽ được nạp khi màn hình quản lý được hoàn thiện.")}`;
}