import { createInitialDemoState } from "./mock-data.js";

const API_BASE = "/api/v1";
const MODE_KEY = "vn-customer-mode-v1"; // "live" | "demo"
const SESSION_KEY = "vn-customer-session-v1";
const HOLD_KEY = "vn-customer-hold-v1";
const DEMO_STORE_KEY = "vn-customer-demo-store-v1";
const LIVE_BOOKINGS_KEY = "vn-customer-live-bookings-v1";

export const HOLD_DURATION_SECONDS = 300;
export const MAX_SEATS_PER_ORDER = 6;

export class ApiError extends Error {
  constructor(message, status = 0, validationErrors = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

export function getMode() {
  const saved = localStorage.getItem(MODE_KEY);
  return saved === "demo" ? "demo" : "live";
}

export function setMode(mode) {
  const next = mode === "demo" ? "demo" : "live";
  localStorage.setItem(MODE_KEY, next);
  clearSession();
  clearActiveHold();
  return next;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.accessToken || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getActiveHold() {
  try {
    const raw = localStorage.getItem(HOLD_KEY);
    if (!raw) return null;
    const hold = JSON.parse(raw);
    if (!hold || !hold.expiresAt || Date.now() >= hold.expiresAt) {
      localStorage.removeItem(HOLD_KEY);
      return null;
    }
    if (hold.mode !== getMode()) {
      localStorage.removeItem(HOLD_KEY);
      return null;
    }
    const session = getSession();
    if (!session || session.user.id !== hold.userId) {
      localStorage.removeItem(HOLD_KEY);
      return null;
    }
    return hold;
  } catch {
    return null;
  }
}

export function setActiveHold(hold) {
  localStorage.setItem(HOLD_KEY, JSON.stringify(hold));
}

export function clearActiveHold() {
  localStorage.removeItem(HOLD_KEY);
}

/* ============================================================================
   Demo store helpers
   ============================================================================ */

function loadDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) return parsed;
    }
  } catch {
    // Re-seed below
  }
  const fresh = createInitialDemoState();
  saveDemoStore(fresh);
  return fresh;
}

function saveDemoStore(store) {
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

function pruneExpiredDemoHolds(store) {
  const now = Date.now();
  let changed = false;
  for (const key of Object.keys(store.holds || {})) {
    if (store.holds[key].expiresAt <= now) {
      delete store.holds[key];
      changed = true;
    }
  }
  if (changed) saveDemoStore(store);
}

export function resetDemoData() {
  const fresh = createInitialDemoState();
  saveDemoStore(fresh);
  clearActiveHold();
}

/* ============================================================================
   Live local booking cache (bridges GET /bookings & cancel until backend adds them)
   ============================================================================ */

function loadLiveBookings(userId) {
  try {
    const raw = localStorage.getItem(LIVE_BOOKINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Array.isArray(map[String(userId)]) ? map[String(userId)] : [];
  } catch {
    return [];
  }
}

function saveLiveBooking(userId, booking) {
  try {
    const raw = localStorage.getItem(LIVE_BOOKINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const list = Array.isArray(map[String(userId)]) ? map[String(userId)] : [];
    const idx = list.findIndex((b) => b.id === booking.id);
    if (idx >= 0) list[idx] = booking;
    else list.unshift(booking);
    map[String(userId)] = list;
    localStorage.setItem(LIVE_BOOKINGS_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

/* ============================================================================
   HTTP helper for Live Backend
   ============================================================================ */

async function request(path, options = {}) {
  const session = getSession();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ Backend tại /api/v1. Kiểm tra Spring Boot đã chạy chưa hoặc chuyển sang chế độ Dữ liệu mẫu.",
      0
    );
  }

  if (res.status === 204) return null;

  let payload = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && session && !options.skipAuthReset) {
      clearSession();
      clearActiveHold();
    }
    const msg =
      payload?.message ||
      payload?.error ||
      (res.status === 409
        ? "Một hoặc nhiều ghế vừa có người khác chọn hoặc hết thời gian giữ."
        : res.status === 401
        ? "Phiên đăng nhập đã hết hạn hoặc thông tin đăng nhập chưa đúng."
        : res.status === 403
        ? "Bạn không có quyền thực hiện thao tác này."
        : `Yêu cầu thất bại (HTTP ${res.status}).`);
    throw new ApiError(msg, res.status, payload?.validationErrors || null);
  }

  // Support both direct DTO responses (current backend) and { success, data } wrapper (api-contract)
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return payload.data;
  }
  return payload;
}

/* ============================================================================
   Public API surface
   ============================================================================ */

export const api = {
  async login({ email, password }) {
    if (getMode() === "demo") {
      const store = loadDemoStore();
      const user = store.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!user || user.password !== password) {
        throw new ApiError("Email hoặc mật khẩu chưa chính xác.", 401);
      }
      const { password: _, ...safeUser } = user;
      const session = {
        accessToken: `demo-token-${safeUser.id}-${Date.now()}`,
        tokenType: "Bearer",
        user: safeUser
      };
      setSession(session);
      return session;
    }

    const res = await request("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      skipAuthReset: true
    });
    const session = {
      accessToken: res.accessToken,
      tokenType: res.tokenType || "Bearer",
      user: res.user
    };
    setSession(session);
    return session;
  },

  async register({ fullName, email, password, phone }) {
    if (getMode() === "demo") {
      const store = loadDemoStore();
      const normalized = email.trim().toLowerCase();
      if (store.users.some((u) => u.email.toLowerCase() === normalized)) {
        throw new ApiError("Email này đã được đăng ký tài khoản.", 409);
      }
      const newUser = {
        id: store.nextUserId++,
        fullName: fullName.trim(),
        email: normalized,
        password,
        phone: phone.trim(),
        role: "CUSTOMER",
        status: "ACTIVE",
        createdAt: new Date().toISOString().slice(0, 19)
      };
      store.users.push(newUser);
      saveDemoStore(store);
      const { password: _, ...safeUser } = newUser;
      return safeUser;
    }

    return request("/auth/register", {
      method: "POST",
      body: {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim()
      },
      skipAuthReset: true
    });
  },

  async getCurrentUser() {
    if (getMode() === "demo") {
      const session = getSession();
      if (!session) throw new ApiError("Bạn chưa đăng nhập.", 401);
      const store = loadDemoStore();
      const found = store.users.find((u) => u.id === session.user.id);
      if (!found) throw new ApiError("Không tìm thấy tài khoản.", 404);
      const { password: _, ...safeUser } = found;
      setSession({ ...session, user: safeUser });
      return safeUser;
    }

    const user = await request("/auth/me");
    const session = getSession();
    if (session) setSession({ ...session, user });
    return user;
  },

  async updateProfile({ fullName, phone }) {
    if (getMode() === "demo") {
      const session = getSession();
      if (!session) throw new ApiError("Bạn chưa đăng nhập.", 401);
      const store = loadDemoStore();
      const idx = store.users.findIndex((u) => u.id === session.user.id);
      if (idx < 0) throw new ApiError("Không tìm thấy tài khoản.", 404);
      store.users[idx] = {
        ...store.users[idx],
        fullName: fullName.trim(),
        phone: phone.trim()
      };
      saveDemoStore(store);
      const { password: _, ...safeUser } = store.users[idx];
      setSession({ ...session, user: safeUser });
      return safeUser;
    }

    const updated = await request("/users/me", {
      method: "PUT",
      body: {
        fullName: fullName.trim(),
        phone: phone.trim()
      }
    });
    const session = getSession();
    if (session) setSession({ ...session, user: updated });
    return updated;
  },

  async getEvents({
    keyword = "",
    status = "",
    page = 0,
    size = 9,
    sortBy = "startTime",
    direction = "ASC"
  } = {}) {
    if (getMode() === "demo") {
      const store = loadDemoStore();
      let list = [...store.events];
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        list = list.filter(
          (e) =>
            e.eventName.toLowerCase().includes(kw) ||
            (e.venueName || "").toLowerCase().includes(kw)
        );
      }
      if (status) {
        list = list.filter((e) => e.status === status);
      }
      list.sort((a, b) => {
        const va = String(a[sortBy] || "");
        const vb = String(b[sortBy] || "");
        return direction === "DESC" ? vb.localeCompare(va) : va.localeCompare(vb);
      });
      const totalElements = list.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));
      const start = page * size;
      const content = list.slice(start, start + size);
      return {
        content,
        totalElements,
        totalPages,
        number: page,
        size,
        first: page === 0,
        last: page >= totalPages - 1
      };
    }

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sortBy", sortBy);
    params.set("direction", direction);
    return request(`/events?${params.toString()}`);
  },

  async getEventById(eventId) {
    if (getMode() === "demo") {
      const store = loadDemoStore();
      const found = store.events.find((e) => String(e.id) === String(eventId));
      if (!found) throw new ApiError("Không tìm thấy sự kiện này.", 404);
      return found;
    }
    return request(`/events/${eventId}`);
  },

  async getEventSeats(eventId) {
    if (getMode() === "demo") {
      const store = loadDemoStore();
      pruneExpiredDemoHolds(store);
      const event = store.events.find((e) => String(e.id) === String(eventId));
      if (!event) throw new ApiError("Không tìm thấy sự kiện này.", 404);
      const rawSeats = store.seatMaps[event.id] || [];
      const seats = rawSeats.map((s) => {
        const holdEntry = store.holds[`${event.id}:${s.id}`];
        return {
          ...s,
          isHeld: s.status === "AVAILABLE" && (Boolean(s.isHeld) || Boolean(holdEntry))
        };
      });
      return {
        eventId: event.id,
        eventName: event.eventName,
        seats
      };
    }
    return request(`/events/${eventId}/seats`);
  },

  async holdSeats(eventId, seatObjects, eventMeta) {
    const session = getSession();
    if (!session) throw new ApiError("Vui lòng đăng nhập để giữ ghế.", 401);

    const eventSeatIds = seatObjects.map((s) => s.id);
    const expiresAt = Date.now() + HOLD_DURATION_SECONDS * 1000;

    if (getMode() === "demo") {
      const store = loadDemoStore();
      pruneExpiredDemoHolds(store);
      const seatList = store.seatMaps[Number(eventId)] || [];
      const seatMap = new Map(seatList.map((s) => [s.id, s]));

      // All-or-nothing atomic check
      for (const sid of eventSeatIds) {
        const s = seatMap.get(sid);
        const existingHold = store.holds[`${eventId}:${sid}`];
        const heldByOther =
          existingHold && existingHold.userId !== session.user.id;
        if (!s || !s.isActive || s.status !== "AVAILABLE" || s.isHeld || heldByOther) {
          throw new ApiError(
            `Ghế ${s?.seatNumber || sid} vừa có người giữ hoặc đã được đặt. Vui lòng chọn ghế khác.`,
            409
          );
        }
      }

      for (const sid of eventSeatIds) {
        store.holds[`${eventId}:${sid}`] = {
          userId: session.user.id,
          expiresAt
        };
      }
      saveDemoStore(store);
    } else {
      await request(`/events/${eventId}/hold-seats`, {
        method: "POST",
        body: { eventSeatIds }
      });
    }

    const holdRecord = {
      mode: getMode(),
      userId: session.user.id,
      eventId: Number(eventId),
      eventName: eventMeta?.eventName || `Sự kiện #${eventId}`,
      venueName: eventMeta?.venueName || "",
      startTime: eventMeta?.startTime || "",
      seats: seatObjects.map((s) => ({
        id: s.id,
        seatNumber: s.seatNumber,
        rowName: s.rowName,
        seatType: s.seatType,
        price: Number(s.price)
      })),
      heldAt: Date.now(),
      expiresAt
    };
    setActiveHold(holdRecord);
    return holdRecord;
  },

  async releaseSeats(eventId, eventSeatIds) {
    const session = getSession();
    if (!session) {
      clearActiveHold();
      return;
    }

    if (getMode() === "demo") {
      const store = loadDemoStore();
      for (const sid of eventSeatIds) {
        const key = `${eventId}:${sid}`;
        if (store.holds[key]?.userId === session.user.id) {
          delete store.holds[key];
        }
      }
      saveDemoStore(store);
      clearActiveHold();
      return;
    }

    try {
      await request(`/events/${eventId}/hold-seats`, {
        method: "DELETE",
        body: { eventSeatIds }
      });
    } finally {
      clearActiveHold();
    }
  },

  async confirmBooking(eventId, holdRecord) {
    const session = getSession();
    if (!session) throw new ApiError("Vui lòng đăng nhập để xác nhận đặt vé.", 401);

    const eventSeatIds = holdRecord.seats.map((s) => s.id);

    if (getMode() === "demo") {
      const store = loadDemoStore();
      pruneExpiredDemoHolds(store);
      const seatList = store.seatMaps[Number(eventId)] || [];
      const seatMap = new Map(seatList.map((s) => [s.id, s]));

      for (const sid of eventSeatIds) {
        const holdEntry = store.holds[`${eventId}:${sid}`];
        const s = seatMap.get(sid);
        if (!holdEntry || holdEntry.userId !== session.user.id) {
          clearActiveHold();
          throw new ApiError(
            "Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế trên sơ đồ.",
            409
          );
        }
        if (!s || s.status !== "AVAILABLE") {
          clearActiveHold();
          throw new ApiError(
            `Ghế ${s?.seatNumber || sid} đã được đặt bởi khách hàng khác.`,
            409
          );
        }
      }

      const nowIso = new Date().toISOString().slice(0, 19);
      const bookingId = store.nextBookingId++;
      const dateStamp = nowIso.slice(0, 10).replace(/-/g, "");
      const bookingCode = `BK-${dateStamp}-${String(bookingId).padStart(6, "0")}`;
      let totalAmount = 0;

      const tickets = eventSeatIds.map((sid) => {
        const seat = seatMap.get(sid);
        seat.status = "BOOKED";
        seat.isHeld = false;
        delete store.holds[`${eventId}:${sid}`];
        totalAmount += Number(seat.price);
        const ticketId = store.nextTicketId++;
        const suffix = Math.random().toString(16).slice(2, 10).toUpperCase();
        return {
          id: ticketId,
          bookingDetailId: ticketId + 1000,
          ticketCode: `TK-${suffix}`,
          eventSeatId: seat.id,
          seatNumber: seat.seatNumber,
          price: Number(seat.price),
          status: "VALID",
          issuedAt: nowIso,
          usedAt: null
        };
      });

      const booking = {
        id: bookingId,
        bookingCode,
        userId: session.user.id,
        eventId: Number(eventId),
        eventName: holdRecord.eventName,
        venueName: holdRecord.venueName,
        startTime: holdRecord.startTime,
        totalAmount,
        status: "CONFIRMED",
        createdAt: nowIso,
        tickets
      };
      store.bookings.unshift(booking);
      saveDemoStore(store);
      clearActiveHold();
      return booking;
    }

    const res = await request(`/events/${eventId}/confirm-booking`, {
      method: "POST",
      body: { eventSeatIds }
    });
    const enriched = {
      ...res,
      venueName: holdRecord.venueName || "",
      startTime: holdRecord.startTime || ""
    };
    saveLiveBooking(session.user.id, enriched);
    clearActiveHold();
    return enriched;
  },

  async getMyBookings() {
    const session = getSession();
    if (!session) throw new ApiError("Vui lòng đăng nhập để xem vé đã đặt.", 401);

    if (getMode() === "demo") {
      const store = loadDemoStore();
      return store.bookings.filter((b) => b.userId === session.user.id);
    }

    try {
      const remote = await request("/bookings");
      if (Array.isArray(remote)) return remote;
      if (remote && Array.isArray(remote.content)) return remote.content;
      return loadLiveBookings(session.user.id);
    } catch (err) {
      // Backend on current develop branch does not yet expose GET /api/v1/bookings
      if (err.status === 404 || err.status === 405 || err.status === 501) {
        return loadLiveBookings(session.user.id);
      }
      throw err;
    }
  },

  async cancelBooking(bookingId) {
    const session = getSession();
    if (!session) throw new ApiError("Vui lòng đăng nhập.", 401);

    if (getMode() === "demo") {
      const store = loadDemoStore();
      const booking = store.bookings.find(
        (b) => String(b.id) === String(bookingId) && b.userId === session.user.id
      );
      if (!booking) throw new ApiError("Không tìm thấy đơn đặt vé.", 404);
      if (booking.status === "CANCELLED") {
        throw new ApiError("Đơn đặt vé này đã được hủy trước đó.", 422);
      }
      if ((booking.tickets || []).some((t) => t.status === "USED")) {
        throw new ApiError("Không thể hủy đơn đã có vé được sử dụng.", 422);
      }
      booking.status = "CANCELLED";
      const seats = store.seatMaps[booking.eventId] || [];
      const seatById = new Map(seats.map((s) => [s.id, s]));
      for (const ticket of booking.tickets || []) {
        if (ticket.status === "VALID") ticket.status = "VOID";
        const seat = seatById.get(ticket.eventSeatId);
        if (seat) {
          seat.status = "AVAILABLE";
          seat.isHeld = false;
        }
      }
      saveDemoStore(store);
      return booking;
    }

    try {
      const res = await request(`/bookings/${bookingId}/cancel`, {
        method: "PUT"
      });
      if (res) saveLiveBooking(session.user.id, res);
      return res;
    } catch (err) {
      if (err.status === 404 || err.status === 405 || err.status === 501) {
        throw new ApiError(
          "Backend chưa mở API hủy đơn PUT /api/v1/bookings/{id}/cancel trên nhánh develop hiện tại.",
          501
        );
      }
      throw err;
    }
  }
};
