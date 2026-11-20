import { renderEmptyState, renderPageHeading } from "../ui.js";

export function renderDashboard() {
  return `${renderPageHeading("Tổng quan", "")}
    ${renderEmptyState("Chưa có số liệu", "Dữ liệu doanh thu và đơn đặt vé sẽ xuất hiện tại đây.")}`;
}