function svg(path, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export const icons = {
  ticket: (s = 18) =>
    svg(
      `<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2 2 0 0 0 0-3V9Z"/><path d="M15 7v10" stroke-dasharray="2.5 2.5"/>`,
      s
    ),
  calendar: (s = 16) =>
    svg(
      `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>`,
      s
    ),
  clock: (s = 16) =>
    svg(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`, s),
  pin: (s = 16) =>
    svg(
      `<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>`,
      s
    ),
  search: (s = 16) =>
    svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`, s),
  user: (s = 16) =>
    svg(
      `<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>`,
      s
    ),
  refresh: (s = 16) =>
    svg(
      `<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>`,
      s
    ),
  check: (s = 16) => svg(`<path d="m5 13 4 4L19 7"/>`, s),
  x: (s = 16) => svg(`<path d="M18 6 6 18M6 6l12 12"/>`, s),
  arrowRight: (s = 16) => svg(`<path d="M5 12h14M13 6l6 6-6 6"/>`, s),
  arrowLeft: (s = 16) => svg(`<path d="M19 12H5M11 18l-6-6 6-6"/>`, s),
  shield: (s = 16) =>
    svg(
      `<path d="M12 3 4 6v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>`,
      s
    ),
  qr: (s = 16) =>
    svg(
      `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>`,
      s
    ),
  logout: (s = 16) =>
    svg(
      `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>`,
      s
    ),
  info: (s = 16) =>
    svg(
      `<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>`,
      s
    ),
  printer: (s = 16) =>
    svg(
      `<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>`,
      s
    )
};
