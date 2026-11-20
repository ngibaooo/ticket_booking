const STORAGE_KEY = "ve-nha-admin-demo-v1";
const SESSION_KEY = "ve-nha-admin-session-v1";

const initialData = {
  venues: [
    {
      id: "venue-001",
      name: "Nhà hát Thành phố",
      address: "07 Công trường Lam Sơn, Quận 1, TP. Hồ Chí Minh",
      status: "ACTIVE",
      seatMap: {
        rows: 8,
        seatsPerRow: 12,
        pricesByRow: { A: "VIP", B: "VIP", C: "STANDARD", D: "STANDARD", E: "STANDARD", F: "ECONOMY", G: "ECONOMY", H: "ECONOMY" },
        lockedSeats: ["H11", "H12"]
      }
    },
    {
      id: "venue-002",
      name: "Cung Văn hóa Hữu nghị",
      address: "91 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
      status: "ACTIVE",
      seatMap: {
        rows: 6,
        seatsPerRow: 10,
        pricesByRow: { A: "VIP", B: "VIP", C: "STANDARD", D: "STANDARD", E: "ECONOMY", F: "ECONOMY" },
        lockedSeats: []
      }
    }
  ],
  events: [
    {
      id: "event-001",
      name: "Đêm nhạc bên sông",
      venueId: "venue-001",
      startsAt: "2026-12-20T19:30:00+07:00",
      saleStartsAt: "2026-11-01T09:00:00+07:00",
      saleEndsAt: "2026-12-20T18:00:00+07:00",
      status: "ON_SALE",
      pricesByTier: { VIP: 1200000, STANDARD: 750000, ECONOMY: 450000 },
      capacity: 96
    },
    {
      id: "event-002",
      name: "Sân khấu trẻ: Chuyện mùa đông",
      venueId: "venue-002",
      startsAt: "2027-01-08T20:00:00+07:00",
      saleStartsAt: "2026-12-01T09:00:00+07:00",
      saleEndsAt: "2027-01-08T18:00:00+07:00",
      status: "DRAFT",
      pricesByTier: { VIP: 900000, STANDARD: 600000, ECONOMY: 350000 },
      capacity: 60
    }
  ],
  bookings: [
    { id: "BK-2026-0108", customerName: "Nguyễn Minh An", eventId: "event-001", seatLabels: ["A03", "A04"], total: 2400000, status: "PENDING", createdAt: "2026-11-20T09:15:00+07:00" },
    { id: "BK-2026-0107", customerName: "Lê Thu Hà", eventId: "event-001", seatLabels: ["C08"], total: 750000, status: "CONFIRMED", createdAt: "2026-11-20T08:42:00+07:00" },
    { id: "BK-2026-0106", customerName: "Trần Quốc Bảo", eventId: "event-001", seatLabels: ["F02", "F03"], total: 900000, status: "CANCELLED", createdAt: "2026-11-19T17:28:00+07:00" }
  ]
};

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function readData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...copy(initialData), ...JSON.parse(saved) } : copy(initialData);
  } catch {
    return copy(initialData);
  }
}

let data = readData();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Backend replacement: GET /api/admin/venues
export async function listVenues() {
  return copy(data.venues);
}

// Backend replacement: GET /api/admin/venues/{id}
export async function getVenue(id) {
  return copy(data.venues.find(venue => venue.id === id) || null);
}

// Backend replacement: POST /api/admin/venues or PUT /api/admin/venues/{id}
export async function saveVenue(venue) {
  const index = data.venues.findIndex(item => item.id === venue.id);
  if (index < 0) {
    data.venues.push({ ...copy(venue), id: venue.id || crypto.randomUUID() });
  } else {
    data.venues[index] = { ...data.venues[index], ...copy(venue) };
  }
  persist();
  return copy(data.venues.find(item => item.id === (venue.id || data.venues.at(-1).id)));
}

// Backend replacement: DELETE /api/admin/venues/{id}; reject when events reference this venue.
export async function deleteVenue(id) {
  if (data.events.some(event => event.venueId === id)) {
    throw new Error("Không thể xóa địa điểm đang có sự kiện.");
  }
  data.venues = data.venues.filter(venue => venue.id !== id);
  persist();
}

// Backend replacement: GET /api/admin/venues/{id}/seat-map
export async function getSeatMap(venueId) {
  const venue = data.venues.find(item => item.id === venueId);
  return venue ? copy(venue.seatMap) : null;
}

// Backend replacement: PUT /api/admin/venues/{id}/seat-map
export async function saveSeatMap(venueId, seatMap) {
  const venue = data.venues.find(item => item.id === venueId);
  if (!venue) throw new Error("Không tìm thấy địa điểm.");
  venue.seatMap = copy(seatMap);
  persist();
  return copy(venue.seatMap);
}

// Backend replacement: GET /api/admin/events
export async function listEvents() {
  return copy(data.events);
}

// Backend replacement: GET /api/admin/events/{id}
export async function getEvent(id) {
  return copy(data.events.find(event => event.id === id) || null);
}

// Backend replacement: POST /api/admin/events or PUT /api/admin/events/{id}
export async function saveEvent(event) {
  const index = data.events.findIndex(item => item.id === event.id);
  if (index < 0) {
    data.events.push({ ...copy(event), id: event.id || crypto.randomUUID() });
  } else {
    data.events[index] = { ...data.events[index], ...copy(event) };
  }
  persist();
  return copy(data.events.find(item => item.id === (event.id || data.events.at(-1).id)));
}

// Backend replacement: DELETE /api/admin/events/{id}; reject when bookings reference this event.
export async function deleteEvent(id) {
  if (data.bookings.some(booking => booking.eventId === id)) {
    throw new Error("Không thể xóa sự kiện đã có đơn đặt vé.");
  }
  data.events = data.events.filter(event => event.id !== id);
  persist();
}

// Backend replacement: GET /api/admin/bookings with query parameters for search and status.
export async function listBookings({ query = "", status = "ALL" } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  return copy(data.bookings.filter(booking => {
    const matchesStatus = status === "ALL" || booking.status === status;
    const matchesQuery = !normalizedQuery || [booking.id, booking.customerName, booking.eventId, ...booking.seatLabels]
      .some(value => String(value).toLocaleLowerCase("vi").includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  }));
}

// Backend replacement: PUT /api/admin/bookings/{id}/status with the requested status.
export async function setBookingStatus(id, status) {
  const booking = data.bookings.find(item => item.id === id);
  if (!booking) throw new Error("Không tìm thấy đơn đặt vé.");
  booking.status = status;
  persist();
  return copy(booking);
}

// Backend replacement: GET /api/admin/dashboard
export async function getDashboardData() {
  const confirmed = data.bookings.filter(booking => booking.status === "CONFIRMED");
  return {
    revenue: confirmed.reduce((sum, booking) => sum + booking.total, 0),
    ticketsSold: confirmed.reduce((sum, booking) => sum + booking.seatLabels.length, 0),
    eventsOnSale: data.events.filter(event => event.status === "ON_SALE").length,
    pendingBookings: data.bookings.filter(booking => booking.status === "PENDING").length,
    events: copy(data.events),
    recentBookings: copy(data.bookings).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  };
}

// Backend replacement: POST /api/admin/auth/login when the admin authentication endpoint is available.
export async function signInDemo(email, password) {
  if (email !== "admin@example.test" || password !== "demo1234") {
    throw new Error("Thông tin đăng nhập thử chưa đúng.");
  }
  const session = { name: "Quản trị viên", email, role: "ADMIN" };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}