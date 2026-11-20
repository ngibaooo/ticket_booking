import { renderEmptyState, renderPageHeading } from "../ui.js";

export function renderSeatMap() {
  return `${renderPageHeading("Sơ đồ ghế", "")}
    ${renderEmptyState("Chưa chọn địa điểm", "Chọn một địa điểm để xem và chỉnh sơ đồ ghế.")}`;
}