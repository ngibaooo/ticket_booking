// Bật true cho phần nào backend đã có endpoint; phần còn lại dùng dữ liệu mẫu.
export const REAL = {
  auth: true,      // POST /auth/login
  events: true,    // /admin/events
  venues: true,    // /venues + /admin/venues
  seats: true,     // /admin/venues/{venueId}/seats
  bookings: false  // backend chưa có controller đặt vé admin
};
export const USE_MOCK = !REAL.auth; // login.js dùng để hiện tài khoản mẫu

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
      pricesByTier: { VIP: 1200000, STANDARD: 750000 },
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
      pricesByTier: { VIP: 1200000, STANDARD: 750000 },
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

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Không kết nối được máy chủ. Kiểm tra backend đã chạy ở cổng 8080.");
  }
  if (response.status === 204) return null;
  if (response.status === 401 && token) {
    signOut();
    location.hash = "#/login";
    throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }
  if (response.status === 403) throw new Error("Tài khoản không có quyền thực hiện thao tác này.");

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const details = payload?.validationErrors ? Object.values(payload.validationErrors).join(" ") : "";
    const message = [payload?.message, details].filter(Boolean).join(" ") || payload?.error || "Yêu cầu đến máy chủ không thành công.";
    throw new Error(message);
  }
  return payload;
}

// POST /api/v1/auth/login
// Mock: data = {accessToken, tokenType, expiresIn, user:{...role:"ADMIN"}}
export async function signIn(email, password) {
  let response;

  if (!REAL.auth) {
    if (email !== "admin@example.test" || password !== "demo1234") {
      throw new Error("Thông tin đăng nhập thử chưa đúng.");
    }
    response = mockResponse({
      accessToken: "mock-admin-token",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: { id: 1, fullName: "Quản trị viên", email, role: "ADMIN", status: "ACTIVE" }
    }, "Login successful");
  } else {
    response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }

  const data = unwrapResponse(response);
  const user = data?.user;
  if (!data?.accessToken) throw new Error("Máy chủ không trả accessToken.");
  if (user?.role !== "ADMIN") throw new Error("Tài khoản này không có quyền quản trị.");

  const session = {
    name: user.fullName || "Quản trị viên",
    email: user.email,
    role: user.role,
    accessToken: data.accessToken,
    tokenType: data.tokenType || "Bearer",
    expiresIn: data.expiresIn
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Dùng cho cả dữ liệu thật và mẫu (mẫu có cùng dạng EventResponse của backend).
function normalizeBackendEvent(event) {
  if (!event) return null;
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
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    pricesByTier: event.pricesByTier ?? null
  };
}

function toStoredEvent(ui, prev = {}) {
  const venue = data.venues.find(item => String(item.id) === String(ui.venueId));
  return {
    ...prev,
    venueId: Number(ui.venueId),
    venueName: venue?.venueName || prev.venueName || "",
    eventName: ui.name,
    description: ui.description ?? prev.description ?? "",
    startTime: ui.startsAt,
    endTime: ui.endsAt,
    saleStartTime: ui.saleStartsAt,
    saleEndTime: ui.saleEndsAt,
    bannerUrl: ui.bannerUrl ?? prev.bannerUrl ?? "",
    status: prev.status ? (ui.status || prev.status) : "DRAFT",
    pricesByTier: ui.pricesByTier ?? prev.pricesByTier ?? null
  };
}

// GET /api/v1/venues
export async function listVenues() {
  // GET /api/v1/admin/venues includes inactive venues for management.
  if (REAL.venues) return unwrapResponse(await apiRequest("/admin/venues"));
  return unwrapResponse(mockResponse(data.venues, "Danh sách địa điểm"));
}

// GET /api/v1/venues/{id}
export async function getVenue(id) {
  // GET /api/v1/venues/{id}
  if (REAL.venues) return unwrapResponse(await apiRequest(`/venues/${encodeURIComponent(id)}`));
  const venue = data.venues.find(item => String(item.id) === String(id)) || null;
  return unwrapResponse(mockResponse(venue, "Chi tiết địa điểm"));
}

// POST /api/v1/admin/venues hoặc PUT /api/v1/admin/venues/{id}
export async function saveVenue(venue) {
  if (REAL.venues) {
    const method = venue.id ? "PUT" : "POST";
    const path = venue.id ? `/admin/venues/${encodeURIComponent(venue.id)}` : "/admin/venues";
    return unwrapResponse(await apiRequest(path, { method, body: JSON.stringify({
      venueName: venue.venueName,
      address: venue.address,
      description: venue.description,
      capacity: Number(venue.capacity)
    }) }));
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
  if (REAL.seats) return unwrapResponse(await apiRequest(`/admin/venues/${encodeURIComponent(venueId)}/seats`));
  const venue = data.venues.find(item => String(item.id) === String(venueId));
  return unwrapResponse(mockResponse(venue ? { venueId: venue.id, seats: venue.seats } : null, "Sơ đồ ghế vật lý"));
}

// POST từng ghế: /api/v1/admin/venues/{id}/seats
// Cập nhật từng ghế: PUT /api/v1/admin/venues/{venueId}/seats/{seatId}
export async function saveSeatMap(venueId, seatMap) {
  // POST từng ghế mới hoặc PUT từng ghế hiện có.
  if (REAL.seats) {
    const currentResponse = await getSeatMap(venueId);
    const currentSeats = Array.isArray(currentResponse) ? currentResponse : currentResponse?.seats || [];
    const currentById = new Map(currentSeats.map(seat => [String(seat.id ?? seat.seatId), seat]));

    for (const seat of seatMap.seats) {
      const body = {
        seatNumber: seat.seatNumber,
        rowName: seat.rowName,
        seatType: seat.seatType,
        positionX: Number(seat.positionX),
        positionY: Number(seat.positionY),
        isActive: seat.isActive !== false
      };

      if (!seat.seatId) {
        await apiRequest(`/admin/venues/${encodeURIComponent(venueId)}/seats`, {
          method: "POST",
          body: JSON.stringify(body)
        });
        continue;
      }

      const current = currentById.get(String(seat.seatId));
      if (!current) throw new Error(`Không tìm thấy ghế ${seat.seatNumber} trên máy chủ.`);
      const changed = Object.entries(body).some(([key, value]) => current[key] !== value);
      if (changed) {
        await apiRequest(`/admin/venues/${encodeURIComponent(venueId)}/seats/${encodeURIComponent(seat.seatId)}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
      }
    }

    return getSeatMap(venueId);
  }
  const venue = data.venues.find(item => String(item.id) === String(venueId));
  if (!venue) throw new Error("Không tìm thấy địa điểm.");
  venue.seats = copy(seatMap.seats);
  venue.capacity = venue.seats.length;
  persist();
  return unwrapResponse(mockResponse({ venueId: venue.id, seats: venue.seats }, "Cập nhật sơ đồ ghế"));
}

// GET /api/v1/admin/events (trả Page: lấy .content)
export async function listEvents() {
  if (!REAL.events) return data.events.map(normalizeBackendEvent);

  const page = await apiRequest("/admin/events?page=0&size=20&sortBy=createdAt&direction=DESC");
  return Promise.all((page?.content || []).map(async event => {
    const normalized = normalizeBackendEvent(event);
    if (event.status === "DRAFT") {
      try {
        const prices = await apiRequest(`/admin/events/${encodeURIComponent(event.id)}/seats/prices`);
        normalized.pricesByTier = {
          VIP: Number(prices?.vipPrice || 0),
          STANDARD: Number(prices?.standardPrice || 0)
        };
      } catch {
        normalized.pricesByTier = null;
      }
      return normalized;
    }
    if (event.status === "CANCELLED") return normalized;
    try {
      const seatData = await apiRequest(`/events/${encodeURIComponent(event.id)}/seats`);
      const priceOf = type => Number(seatData?.seats?.find(seat => seat.seatType === type)?.price || 0);
      normalized.pricesByTier = { VIP: priceOf("VIP"), STANDARD: priceOf("STANDARD") };
    } catch {
      normalized.pricesByTier = null;
    }
    return normalized;
  }));
}

// GET /api/v1/admin/events/{id}
export async function getEvent(id) {
  if (!REAL.events) return normalizeBackendEvent(data.events.find(item => String(item.id) === String(id)) || null);
  return normalizeBackendEvent(await apiRequest(`/admin/events/${encodeURIComponent(id)}`));
}

// Tạo: POST /admin/events (luôn DRAFT, bắt buộc seatPrices).
// Sửa: PATCH /admin/events/{id} + PUT /admin/events/{id}/seats/prices (chỉ khi DRAFT/UPCOMING),
// rồi PATCH /admin/events/{id}/status (chỉ đi từng bước: DRAFT>UPCOMING>OPEN>CLOSED>COMPLETED).
export async function saveEvent(event) {
  if (!REAL.events) {
    const index = data.events.findIndex(item => String(item.id) === String(event.id));
    const now = new Date().toISOString().slice(0, 19);
    let saved;
    if (index >= 0) {
      saved = { ...toStoredEvent(event, data.events[index]), updatedAt: now };
      data.events[index] = saved;
    } else {
      saved = { ...toStoredEvent(event), id: Math.max(100, ...data.events.map(item => Number(item.id) || 0)) + 1, createdAt: now, updatedAt: now };
      data.events.push(saved);
    }
    persist();
    return normalizeBackendEvent(saved);
  }

  const p = event.pricesByTier;
  const priceBody = p && p.STANDARD > 0 && p.VIP > 0 ? { standardPrice: Number(p.STANDARD), vipPrice: Number(p.VIP) } : null;
  const toLocalDateTime = value => {
    if (!value) return value;
    const local = String(value).replace(/Z$/i, "");
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? `${local}:00` : local;
  };
  const fields = {
    eventName: event.name,
    description: event.description || "",
    startTime: toLocalDateTime(event.startsAt),
    endTime: toLocalDateTime(event.endsAt),
    saleStartTime: toLocalDateTime(event.saleStartsAt),
    saleEndTime: toLocalDateTime(event.saleEndsAt),
    bannerUrl: event.bannerUrl || ""
  };

  if (!event.id) {
    if (!priceBody) throw new Error("Nhập giá VIP và Thường lớn hơn 0.");
    const created = await apiRequest("/admin/events", {
      method: "POST",
      body: JSON.stringify({ venueId: Number(event.venueId), ...fields, seatPrices: priceBody })
    });
    return normalizeBackendEvent(created);
  }

  const id = encodeURIComponent(event.id);
  let latest = await apiRequest(`/admin/events/${id}`);
  if (latest.status === "DRAFT" || latest.status === "UPCOMING") {
    latest = await apiRequest(`/admin/events/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
    if (priceBody) await apiRequest(`/admin/events/${id}/seats/prices`, { method: "PUT", body: JSON.stringify(priceBody) });
  }
  if (event.status && event.status !== latest.status) {
    latest = await apiRequest(`/admin/events/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: event.status }) });
  }
  return normalizeBackendEvent(latest);
}

// Backend hiện chưa cung cấp DELETE /api/v1/admin/events/{id}; không gọi API giả.
export async function deleteEvent() {
  throw new Error("Backend chưa hỗ trợ xóa hoặc hủy sự kiện.");
}

function normalizeBooking(booking) {
  const seatLabels = booking.seatNumbers
    || (booking.tickets || []).map(ticket => ticket.seatNumber).filter(Boolean);
  return {
    ...booking,
    id: String(booking.bookingId ?? booking.id),
    eventId: String(booking.eventId),
    customerName: booking.customerName || (booking.userId ? `Người dùng #${booking.userId}` : "Khách hàng"),
    seatLabels: seatLabels || [],
    total: booking.total ?? booking.totalAmount ?? 0
  };
}

// GET /api/v1/admin/bookings: backend chưa có, nên dùng dữ liệu mẫu cho tới khi REAL.bookings = true.
export async function listBookings({ query = "", status = "ALL" } = {}) {
  let source = data.bookings;
  if (REAL.bookings) {
    const payload = await apiRequest("/admin/bookings?page=0&size=100");
    source = payload?.content ?? payload ?? [];
  }
  const q = query.trim().toLocaleLowerCase("vi");
  return source
    .filter(booking => (status === "ALL" || booking.status === status)
      && (!q || [booking.bookingCode, booking.customerName, booking.eventId, ...(booking.seatNumbers || [])]
        .some(value => String(value ?? "").toLocaleLowerCase("vi").includes(q))))
    .map(normalizeBooking);
}

// Dashboard tự tính từ sự kiện và đặt vé (chưa có endpoint thống kê).
export async function getDashboardData() {
  const [events, bookings] = await Promise.all([listEvents(), listBookings()]);
  const confirmed = bookings.filter(booking => booking.status === "CONFIRMED");
  const total = list => list.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
  return {
    revenue: total(confirmed),
    ticketsSold: confirmed.reduce((sum, booking) => sum + (booking.tickets?.length ?? booking.seatNumbers?.length ?? 0), 0),
    eventsOnSale: events.filter(event => event.status === "OPEN").length,
    pendingBookings: 0,
    events,
    revenueByEvent: events.map(event => ({ eventId: event.id, revenue: total(confirmed.filter(booking => booking.eventId === event.id)) })),
    recentBookings: bookings.slice().sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt))).slice(0, 5)
  };
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