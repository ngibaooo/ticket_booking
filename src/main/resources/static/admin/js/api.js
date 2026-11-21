// Đổi thành false khi backend đã sẵn sàng endpoint tương ứng.
export const USE_MOCK = true;

const STORAGE_KEY = "ve-nha-admin-demo-v1";
const SESSION_KEY = "ve-nha-admin-session-v1";
const API_BASE = "/api/v1";

const initialData = {
  venues: [
    {
      id: 1,
      venueName: "Nhà hát Thành phố",
      address: "07 Công trường Lam Sơn, Quận 1, TP. Hồ Chí Minh",
      description: "Nhà hát tại trung tâm thành phố",
      capacity: 96,
      status: "ACTIVE",
      createdAt: "2026-11-01T09:00:00",
      seats: [
        ...["A", "B"].flatMap(row => Array.from({ length: 12 }, (_, index) => ({
          seatId: index + 1 + (["A", "B"].indexOf(row) * 12),
          seatNumber: `${row}${String(index + 1).padStart(2, "0")}`,
          rowName: row,
          seatType: "VIP",
          positionX: index + 1,
          positionY: ["A", "B"].indexOf(row) + 1,
          isActive: true
        }))),
        ...["C", "D", "E"].flatMap(row => Array.from({ length: 12 }, (_, index) => ({
          seatId: index + 25 + (["C", "D", "E"].indexOf(row) * 12),
          seatNumber: `${row}${String(index + 1).padStart(2, "0")}`,
          rowName: row,
          seatType: "STANDARD",
          positionX: index + 1,
          positionY: ["C", "D", "E"].indexOf(row) + 3,
          isActive: true
        }))),
        ...["F", "G", "H"].flatMap(row => Array.from({ length: 12 }, (_, index) => ({
          seatId: index + 61 + (["F", "G", "H"].indexOf(row) * 12),
          seatNumber: `${row}${String(index + 1).padStart(2, "0")}`,
          rowName: row,
          seatType: "STANDARD",
          positionX: index + 1,
          positionY: ["F", "G", "H"].indexOf(row) + 6,
          isActive: !(row === "H" && index >= 10)
        })))
      ]
    },
    {
      id: 2,
      venueName: "Cung Văn hóa Hữu nghị",
      address: "91 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
      description: "Trung tâm văn hóa, hội nghị",
      capacity: 60,
      status: "ACTIVE",
      createdAt: "2026-11-02T09:00:00",
      seats: ["A", "B", "C", "D", "E", "F"].flatMap((row, rowIndex) =>
        Array.from({ length: 10 }, (_, index) => ({
          seatId: rowIndex * 10 + index + 97,
          seatNumber: `${row}${String(index + 1).padStart(2, "0")}`,
          rowName: row,
          seatType: rowIndex < 2 ? "VIP" : rowIndex < 4 ? "STANDARD" : "STANDARD",
          positionX: index + 1,
          positionY: rowIndex + 1,
          isActive: true
        }))
      )
    }
  ],
  events: [
    {
      id: 101,
      venueId: 1,
      venueName: "Nhà hát Thành phố",
      eventName: "Đêm nhạc bên sông",
      description: "Chương trình âm nhạc ngoài trời",
      startTime: "2026-12-20T19:30:00",
      endTime: "2026-12-20T22:30:00",
      saleStartTime: "2026-11-01T09:00:00",
      saleEndTime: "2026-12-20T18:00:00",
      bannerUrl: "",
      status: "OPEN",
      createdAt: "2026-11-01T10:00:00",
      updatedAt: "2026-11-01T10:00:00"
    },
    {
      id: 102,
      venueId: 2,
      venueName: "Cung Văn hóa Hữu nghị",
      eventName: "Sân khấu trẻ: Chuyện mùa đông",
      description: "Sân khấu kịch",
      startTime: "2027-01-08T20:00:00",
      endTime: "2027-01-08T22:00:00",
      saleStartTime: "2026-12-01T09:00:00",
      saleEndTime: "2027-01-08T18:00:00",
      bannerUrl: "",
      status: "DRAFT",
      createdAt: "2026-11-02T10:00:00",
      updatedAt: "2026-11-02T10:00:00"
    }
  ],
  bookings: [
    {
      bookingId: 501,
      bookingCode: "BK-20261115-000001",
      eventId: 101,
      totalAmount: 2400000,
      status: "CONFIRMED",
      customerName: "Nguyễn Minh An",
      seatNumbers: ["A03", "A04"],
      createdAt: "2026-11-20T09:15:00",
      tickets: [{ ticketId: 1001, ticketCode: "TK-8F2A9B71", status: "VALID" }]
    },
    {
      bookingId: 502,
      bookingCode: "BK-20261120-000002",
      eventId: 101,
      totalAmount: 750000,
      status: "CONFIRMED",
      customerName: "Lê Thu Hà",
      seatNumbers: ["C08"],
      createdAt: "2026-11-20T08:42:00",
      tickets: [{ ticketId: 1002, ticketCode: "TK-C8D7A111", status: "VALID" }]
    },
    {
      bookingId: 503,
      bookingCode: "BK-20261119-000003",
      eventId: 101,
      totalAmount: 900000,
      status: "CANCELLED",
      customerName: "Trần Quốc Bảo",
      seatNumbers: ["F02", "F03"],
      createdAt: "2026-11-19T17:28:00",
      tickets: [{ ticketId: 1003, ticketCode: "TK-F02A9911", status: "VOID" }]
    }
  ]
};

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function readData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return copy(initialData);
    const parsed = JSON.parse(saved);
    const contractReady = parsed?.venues?.[0]?.venueName && parsed?.events?.[0]?.eventName && parsed?.bookings?.[0]?.bookingCode;
    return contractReady ? parsed : copy(initialData);
  } catch {
    return copy(initialData);
  }
}

let data = readData();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function mockResponse(result, message = "Request successful") {
  return {
    success: true,
    message,
    data: copy(result),
    timestamp: new Date().toISOString().slice(0, 19)
  };
}

function unwrapResponse(response) {
  return response && Object.prototype.hasOwnProperty.call(response, "data") ? response.data : response;
}

// Khi USE_MOCK=false, mọi hàm đọc/ghi dùng fetch /api/v1/... và Authorization: Bearer <token>.

function getToken() {
  return getSession()?.accessToken || "";
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { "Accept": "application/json", ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.message || payload?.error || "Yêu cầu đến máy chủ không thành công.";
    throw new Error(message);
  }
  return payload;
}

// POST /api/v1/auth/login
// Mock: data = {accessToken, tokenType, expiresIn, user:{...role:"ADMIN"}}
export async function signIn(email, password) {
  if (USE_MOCK) {
    if (email !== "admin@example.test" || password !== "demo1234") {
      throw new Error("Thông tin đăng nhập thử chưa đúng.");
    }
    return mockResponse({
      accessToken: "mock-admin-token",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: { id: 1, fullName: "Quản trị viên", email, role: "ADMIN", status: "ACTIVE" }
    }, "Login successful");
  }

  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

function normalizeBackendEvent(event) {
  if (!event) return null;
  const status = event.status;
  return {
    id: String(event.id),
    name: event.eventName,
    venueId: event.venueId != null ? String(event.venueId) : "",
    venueName: event.venueName || "",
    description: event.description || "",
    startsAt: event.startTime,
    endsAt: event.endTime,
    saleStartsAt: event.saleStartTime,
    saleEndsAt: event.saleEndTime,
    bannerUrl: event.bannerUrl || "",
    status,
    backendStatus: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    pricesByTier: { VIP: 0, STANDARD: 0, ECONOMY: 0 }
  };
}

// GET /api/v1/venues
export async function listVenues() {
  // GET /api/v1/venues
  if (!USE_MOCK) return await apiRequest("/venues");
  return unwrapResponse(mockResponse(data.venues, "Danh sách địa điểm"));
}

// GET /api/v1/venues/{id}
export async function getVenue(id) {
  // GET /api/v1/venues/{id}
  if (!USE_MOCK) return await apiRequest(`/venues/${encodeURIComponent(id)}`);
  const venue = data.venues.find(item => String(item.id) === String(id)) || null;
  return unwrapResponse(mockResponse(venue, "Chi tiết địa điểm"));
}

// POST /api/v1/admin/venues hoặc PUT /api/v1/admin/venues/{id}
export async function saveVenue(venue) {
  if (!USE_MOCK) {
    const method = venue.id ? "PUT" : "POST";
    const path = venue.id ? `/admin/venues/${encodeURIComponent(venue.id)}` : "/admin/venues";
    return await apiRequest(path, { method, body: JSON.stringify({
      venueName: venue.venueName,
      address: venue.address,
      description: venue.description,
      capacity: Number(venue.capacity)
    }) });
  }

  const index = data.venues.findIndex(item => String(item.id) === String(venue.id));
  if (index < 0) {
    data.venues.push({ ...copy(venue), id: venue.id || crypto.randomUUID() });
  } else {
    data.venues[index] = { ...data.venues[index], ...copy(venue) };
  }
  persist();
  const saved = data.venues.find(item => String(item.id) === String(venue.id || data.venues.at(-1).id));
  return unwrapResponse(mockResponse(saved, venue.id ? "Cập nhật địa điểm thành công" : "Tạo địa điểm thành công"));
}

// Contract không cung cấp API xóa địa điểm.
export async function deleteVenue(id) {
  if (data.events.some(event => event.venueId === id)) {
    throw new Error("Không thể xóa địa điểm đang có sự kiện.");
  }
  data.venues = data.venues.filter(venue => String(venue.id) !== String(id));
  persist();
  return unwrapResponse(mockResponse(null, "Xóa địa điểm thành công"));
}

// GET /api/v1/admin/venues/{id}/seats
export async function getSeatMap(venueId) {
  // GET /api/v1/admin/venues/{venueId}/seats
  if (!USE_MOCK) return await apiRequest(`/admin/venues/${encodeURIComponent(venueId)}/seats`);
  const venue = data.venues.find(item => String(item.id) === String(venueId));
  return unwrapResponse(mockResponse(venue ? { venueId: venue.id, seats: venue.seats } : null, "Sơ đồ ghế vật lý"));
}

// POST từng ghế: /api/v1/admin/venues/{id}/seats
// Cập nhật từng ghế: PUT /api/v1/admin/venues/{venueId}/seats/{seatId}
export async function saveSeatMap(venueId, seatMap) {
  // POST từng ghế mới hoặc PUT từng ghế hiện có.
  if (!USE_MOCK) {
    const venue = await apiRequest(`/admin/venues/${encodeURIComponent(venueId)}/seats`);
    return venue;
  }
  const venue = data.venues.find(item => String(item.id) === String(venueId));
  if (!venue) throw new Error("Không tìm thấy địa điểm.");
  venue.seats = copy(seatMap.seats);
  venue.capacity = venue.seats.length;
  persist();
  return unwrapResponse(mockResponse({ venueId: venue.id, seats: venue.seats }, "Cập nhật sơ đồ ghế"));
}

// GET /api/v1/admin/events
export async function listEvents() {
  if (USE_MOCK) return unwrapResponse(mockResponse(copy(data.events), "Danh sách sự kiện"));

  const page = await apiRequest("/admin/events?page=0&size=100&sortBy=createdAt&direction=DESC");
  if (page?.content) {
    return Promise.all(page.content.map(async event => {
      const normalized = normalizeBackendEvent(event);
      try {
        const seatData = await apiRequest(`/events/${encodeURIComponent(event.id)}/seats`);
        const vipSeat = seatData?.seats?.find(seat => seat.seatType === "VIP");
        const standardSeat = seatData?.seats?.find(seat => seat.seatType === "STANDARD");
        normalized.pricesByTier = {
          VIP: Number(vipSeat?.price || 0),
          STANDARD: Number(standardSeat?.price || 0),
          ECONOMY: 0
        };
      } catch {
        normalized.pricesByTier = { VIP: 0, STANDARD: 0, ECONOMY: 0 };
      }
      return normalized;
    }));
  }
  return unwrapResponse(mockResponse([], "Danh sách sự kiện"));
}

// GET /api/v1/admin/events/{id}
export async function getEvent(id) {
  if (USE_MOCK) {
    const event = data.events.find(item => String(item.id) === String(id)) || null;
    return unwrapResponse(mockResponse(event, "Chi tiết sự kiện"));
  }
  const event = await apiRequest(`/admin/events/${encodeURIComponent(id)}`);
  return normalizeBackendEvent(event);
}

// POST /api/v1/admin/events
// PUT /api/v1/admin/events/{id}
export async function saveEvent(event) {
  if (USE_MOCK) {
    const index = data.events.findIndex(item => String(item.id) === String(event.id));
    const saved = index >= 0
      ? { ...data.events[index], ...copy(event), updatedAt: new Date().toISOString().slice(0, 19) }
      : { ...copy(event), id: Math.max(100, ...data.events.map(item => Number(item.id) || 0)) + 1, createdAt: new Date().toISOString().slice(0, 19), updatedAt: new Date().toISOString().slice(0, 19) };
    if (index >= 0) data.events[index] = saved;
    else data.events.push(saved);
    persist();
    return unwrapResponse(mockResponse(saved, index >= 0 ? "Cập nhật sự kiện thành công" : "Tạo sự kiện thành công"));
  }

  if (!event.id) {
    const venueId = Number(event.venueId);
    const payload = {
      venueId,
      eventName: event.name,
      description: event.description || "",
      startTime: event.startsAt,
      endTime: event.endsAt,
      saleStartTime: event.saleStartsAt,
      saleEndTime: event.saleEndsAt,
      bannerUrl: event.bannerUrl || "",
      seatPrices: {
        standardPrice: Number(event.pricesByTier?.STANDARD || 0),
        vipPrice: Number(event.pricesByTier?.VIP || 0)
      }
    };
    const created = await apiRequest("/admin/events", { method: "POST", body: JSON.stringify(payload) });
    if (event.status && event.status !== "DRAFT") {
      await apiRequest(`/admin/events/${created.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: event.status === "ON_SALE" ? "OPEN" : event.status })
      });
    }
    return normalizeBackendEvent(created);
  }

  const payload = {
    eventName: event.name,
    description: event.description || "",
    startTime: event.startsAt,
    endTime: event.endsAt,
    saleStartTime: event.saleStartsAt,
    saleEndTime: event.saleEndsAt,
    bannerUrl: event.bannerUrl || ""
  };
  const updated = await apiRequest(`/admin/events/${encodeURIComponent(event.id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  const targetStatus = event.status === "ON_SALE" ? "OPEN" : event.status;
  if (targetStatus && targetStatus !== updated.status) {
    await apiRequest(`/admin/events/${encodeURIComponent(event.id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: targetStatus })
    });
  }
  return normalizeBackendEvent(updated);
}

// Backend hiện chưa cung cấp DELETE /api/v1/admin/events/{id}; không gọi API giả.
export async function deleteEvent() {
  throw new Error("Backend hiện chưa hỗ trợ xóa sự kiện. Chỉ có thể chuyển trạng thái CANCELLED.");
}

// GET /api/v1/admin/bookings - tìm kiếm và lọc tại FE
export async function listBookings({ query = "", status = "ALL" } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const result = data.bookings.filter(booking => {
    const matchesStatus = status === "ALL" || booking.status === status;
    const matchesQuery = !normalizedQuery || [booking.bookingCode, booking.customerName, booking.eventId, ...booking.seatNumbers]
      .some(value => String(value).toLocaleLowerCase("vi").includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  });
  if (!USE_MOCK) return await apiRequest(`/admin/bookings?query=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`);
  return unwrapResponse(mockResponse(result, "Danh sách đặt vé"));
}

// Contract không có admin xác nhận/hủy. Customer hủy dùng PUT /api/v1/bookings/{id}/cancel.
export async function setBookingStatus(id, status) {
  const booking = data.bookings.find(item => String(item.bookingId) === String(id));
  if (!booking) throw new Error("Không tìm thấy đơn đặt vé.");
  booking.status = status;
  persist();
  return unwrapResponse(mockResponse(booking, "Cập nhật trạng thái đặt vé"));
}

// Dashboard được tính từ dữ liệu đặt vé và sự kiện hiện có.
export async function getDashboardData() {
  if (!USE_MOCK) {
    const [events, bookings] = await Promise.all([
      listEvents(),
      listBookings({ query: "", status: "ALL" })
    ]);
    const eventList = unwrapResponse(events) || [];
    const bookingList = unwrapResponse(bookings) || [];
    const confirmed = bookingList.filter(booking => booking.status === "CONFIRMED");
    const revenueByEvent = eventList.map(event => ({
      eventId: event.id,
      revenue: confirmed.filter(booking => String(booking.eventId) === String(event.id)).reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
    }));
    return mockResponse({
      revenue: confirmed.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
      ticketsSold: confirmed.reduce((sum, booking) => sum + (booking.tickets?.length || 0), 0),
      eventsOnSale: eventList.filter(event => event.status === "OPEN").length,
      pendingBookings: 0,
      events: eventList,
      revenueByEvent,
      recentBookings: bookingList.slice(0, 5)
    });
  }

  const confirmed = data.bookings.filter(booking => booking.status === "CONFIRMED");
  const revenueByEvent = data.events.map(event => ({
    eventId: event.id,
    revenue: confirmed
      .filter(booking => String(booking.eventId) === String(event.id))
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
  }));

  return mockResponse({
    revenue: confirmed.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
    ticketsSold: confirmed.reduce((sum, booking) => sum + (booking.seatNumbers?.length || 0), 0),
    eventsOnSale: data.events.filter(event => event.status === "OPEN").length,
    pendingBookings: 0,
    events: copy(data.events),
    revenueByEvent,
    recentBookings: copy(data.bookings).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  });
}

// POST /api/v1/auth/login
export async function signIn(email, password) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const user = response?.user;
  if (!user || user.role !== "ADMIN") {
    throw new Error("Tài khoản này không có quyền quản trị.");
  }
  const session = {
    name: user.fullName || "Quản trị viên",
    email: user.email,
    role: user.role,
    accessToken: response.accessToken
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return session?.accessToken && session.role === "ADMIN" ? session : null;
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}