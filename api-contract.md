# API CONTRACT – TICKET BOOKING SYSTEM

## 1. Tổng quan

Hệ thống sử dụng RESTful API để trao đổi dữ liệu giữa Frontend và Backend.

| Thành phần | Quy ước |
|---|---|
| Kiến trúc | RESTful API |
| Protocol | HTTP/HTTPS |
| Data format | JSON |
| API prefix | `/api/v1` |
| Authentication | JWT Bearer Token |
| Database | PostgreSQL |
| Cache | Redis |

### 1.1. Authentication

Các API yêu cầu xác thực sử dụng Header:

```http
Authorization: Bearer <access_token>
```

### 1.2. Response format

Response JSON thống nhất:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-11-15T10:00:00"
}
```

### 1.3. HTTP Status Code

| Status Code | Ý nghĩa |
|---|---|
| 200 | OK – Thành công |
| 201 | Created – Tạo thành công |
| 204 | No Content – Thành công, không có dữ liệu trả về |
| 400 | Bad Request – Dữ liệu không hợp lệ |
| 401 | Unauthorized – Chưa xác thực |
| 403 | Forbidden – Không có quyền truy cập |
| 404 | Not Found – Không tìm thấy tài nguyên |
| 409 | Conflict – Xung đột dữ liệu hoặc nghiệp vụ |
| 422 | Unprocessable Entity – Không thỏa mãn điều kiện nghiệp vụ |
| 500 | Internal Server Error – Lỗi hệ thống |

## 2. Authentication API

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Đăng ký |
| POST | `/api/v1/auth/login` | Public | Đăng nhập |
| GET | `/api/v1/auth/me` | CUSTOMER / ADMIN | Lấy thông tin người dùng hiện tại |

### Register – POST `/api/v1/auth/register`

Request:

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "password": "Password123",
  "phone": "0901234567"
}
```

Response: Thông tin tài khoản vừa đăng ký, không bao gồm password.

### Login – POST `/api/v1/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "fullName": "Nguyen Van A",
      "email": "user@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

## 3. User API

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| GET | `/api/v1/users/me` | CUSTOMER / ADMIN | Xem thông tin cá nhân |
| PUT | `/api/v1/users/me` | CUSTOMER / ADMIN | Cập nhật thông tin cá nhân |
| GET | `/api/v1/admin/users` | ADMIN | Xem danh sách người dùng |
| PUT | `/api/v1/admin/users/{id}/status` | ADMIN | Cập nhật trạng thái tài khoản |

### Update Profile – PUT `/api/v1/users/me`

Request:

```json
{
  "fullName": "Nguyen Van B",
  "phone": "0912345678"
}
```

### Update User Status – PUT `/api/v1/admin/users/{id}/status`

Request:

```json
{
  "status": "LOCKED"
}
```

Giá trị hợp lệ: `ACTIVE`, `INACTIVE`, `LOCKED`.

## 4. Event API

| Method | Endpoint                                       | Quyền  | Chức năng                                |
|---|------------------------------------------------|--------|------------------------------------------|
| GET | `/api/v1/events`                               | Public | Lấy danh sách sự kiện (Customer & Guest) |
| GET | `/api/v1/events/{id}`                          | Public | Xem chi tiết sự kiện (Customer & Guest)                    |
| GET | `/api/v1/events/{eventId}/seats`               | Public | Xem sơ đồ và trạng thái ghế              |
| GET | `/api/v1/events/{eventId}/seats/{eventSeatId}` | Public | Xem thông tin ghế thuộc sự kiện          |
| GET | `/api/v1/admin/events`                         | ADMIN  | Admin lấy danh sách sự kiện              |
| GET | `/api/v1/admin/events/{id}`                    | ADMIN  | Admin xem chi tiết sự kiện               |
| POST | `/api/v1/admin/events`                         | ADMIN  | Tạo sự kiện                              |
| PUT | `/api/v1/admin/events/{id}`                    | ADMIN  | Cập nhật sự kiện                         |
| PUT | `/api/v1/admin/events/{id}/status`             | ADMIN  | Cập nhật trạng thái sự kiện              |
| PUT | `/api/v1/admin/events/{eventId}/seats/prices`  | ADMIN  | Thiết lập giá ghế của sự kiện            |

### Create Event – POST `/api/v1/admin/events`

Request:

```json
{
  "venueId": 1,
  "eventName": "Music Festival 2026",
  "description": "Annual music festival",
  "startTime": "2026-12-20T19:00:00",
  "endTime": "2026-12-20T22:00:00",
  "saleStartTime": "2026-11-15T08:00:00",
  "saleEndTime": "2026-12-19T23:00:00",
  "bannerUrl": "https://example.com/banner.jpg"
}
```

Sự kiện mới mặc định có trạng thái `DRAFT`. Backend tự động tạo danh sách EVENT_SEATS từ các ghế đang hoạt động thuộc địa điểm tổ chức.

### Update Event Status – PUT `/api/v1/admin/events/{id}/status`

Request:

```json
{
  "status": "OPEN"
}
```

Giá trị hợp lệ: `DRAFT`, `UPCOMING`, `OPEN`, `CLOSED`, `COMPLETED`, `CANCELLED`.

### Update Event Seat Prices – PUT `/api/v1/admin/events/{eventId}/seats/prices`

Request:

```json
{
  "seats": [
    {
      "eventSeatId": 101,
      "price": 150000
    },
    {
      "eventSeatId": 102,
      "price": 250000
    }
  ]
}
```

### Event Seats Response

API `GET /api/v1/events/{eventId}/seats` trả về danh sách ghế kèm trạng thái:

```json
{
  "eventId": 1,
  "seats": [
    {
      "eventSeatId": 101,
      "seatId": 1,
      "seatNumber": "A01",
      "rowName": "A",
      "seatType": "STANDARD",
      "positionX": 1,
      "positionY": 1,
      "price": 150000,
      "status": "AVAILABLE"
    }
  ]
}
```

Trạng thái ghế trả về Frontend:

- `AVAILABLE`: Ghế chưa được đặt hoặc giữ.
- `HELD`: Ghế đang được giữ tạm thời trên Redis.
- `BOOKED`: Ghế đã được đặt thành công.

## 5. Booking API

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| POST | `/api/v1/bookings/hold` | CUSTOMER | Giữ ghế |
| GET | `/api/v1/bookings/hold?eventId={eventId}` | CUSTOMER | Kiểm tra ghế đang giữ |
| DELETE | `/api/v1/bookings/hold/{eventId}` | CUSTOMER | Hủy giữ ghế |
| POST | `/api/v1/bookings/confirm` | CUSTOMER | Xác nhận đặt vé |
| GET | `/api/v1/bookings` | CUSTOMER | Xem danh sách đơn của mình |
| GET | `/api/v1/bookings/{id}` | CUSTOMER | Xem chi tiết đơn của mình |
| PUT | `/api/v1/bookings/{id}/cancel` | CUSTOMER | Hủy đơn đặt vé |
| GET | `/api/v1/admin/bookings` | ADMIN | Xem danh sách đơn đặt vé |
| GET | `/api/v1/admin/bookings/{id}` | ADMIN | Xem chi tiết đơn đặt vé |

### Hold Seats – POST `/api/v1/bookings/hold`

Request:

```json
{
  "eventId": 1,
  "eventSeatIds": [101, 102, 103]
}
```

Response:

```json
{
  "eventId": 1,
  "heldSeats": [
    {
      "eventSeatId": 101,
      "seatNumber": "A01",
      "price": 150000
    }
  ],
  "expiresIn": 300,
  "expiresAt": "2026-11-15T10:05:00"
}
```

Thời gian giữ ghế là 300 giây (5 phút). Redis quản lý trạng thái giữ ghế tạm thời.

### Confirm Booking – POST `/api/v1/bookings/confirm`

Request:

```json
{
  "eventId": 1,
  "eventSeatIds": [101, 102, 103]
}
```

Backend kiểm tra quyền giữ ghế, tính tổng tiền và tạo Booking, BookingDetails, Tickets trong PostgreSQL transaction.

Response:

```json
{
  "bookingId": 501,
  "bookingCode": "BK-20261115-000001",
  "eventId": 1,
  "totalAmount": 450000,
  "status": "CONFIRMED",
  "tickets": [
    {
      "ticketId": 1001,
      "ticketCode": "TK-8F2A9B71",
      "status": "VALID"
    }
  ]
}
```

### Cancel Booking – PUT `/api/v1/bookings/{id}/cancel`

Không cần Request Body.

Khi hủy đơn thành công:

- Booking chuyển sang `CANCELLED`.
- Các Ticket `VALID` chuyển sang `VOID`.
- Ghế được giải phóng nếu đáp ứng điều kiện nghiệp vụ.
- Không cho phép hủy nếu đã có vé `USED`.

## 6. Ticket API

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| GET | `/api/v1/tickets/{id}` | CUSTOMER | Xem thông tin vé |
| GET | `/api/v1/tickets/{id}/qr` | CUSTOMER | Lấy ảnh QR của vé |
| POST | `/api/v1/admin/tickets/validate` | ADMIN | Kiểm tra và xác nhận sử dụng vé |

### Get Ticket QR – GET `/api/v1/tickets/{id}/qr`

Backend tạo mã QR từ `ticketCode` bằng thư viện ZXing.

Response:

```http
Content-Type: image/png
```

### Validate Ticket – POST `/api/v1/admin/tickets/validate`

Request:

```json
{
  "ticketCode": "TK-8F2A9B71"
}
```

Backend kiểm tra vé có tồn tại và trạng thái `VALID`, sau đó cập nhật thành `USED` và ghi nhận `usedAt`.

Các vé `USED` hoặc `VOID` không được sử dụng lại.

## 7. Venue API

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| GET | `/api/v1/venues` | Public | Lấy danh sách địa điểm |
| GET | `/api/v1/venues/{id}` | Public | Xem chi tiết địa điểm |
| POST | `/api/v1/admin/venues` | ADMIN | Tạo địa điểm |
| PUT | `/api/v1/admin/venues/{id}` | ADMIN | Cập nhật địa điểm |
| GET | `/api/v1/admin/venues/{id}/seats` | ADMIN | Xem sơ đồ ghế vật lý |
| POST | `/api/v1/admin/venues/{id}/seats` | ADMIN | Thêm ghế vật lý |
| PUT | `/api/v1/admin/venues/{venueId}/seats/{seatId}` | ADMIN | Cập nhật ghế vật lý |
| DELETE | `/api/v1/admin/venues/{venueId}/seats/{seatId}` | ADMIN | Xóa ghế nếu chưa được sử dụng |

### Create Venue – POST `/api/v1/admin/venues`

Request:

```json
{
  "venueName": "City Stadium",
  "address": "Ho Chi Minh City",
  "description": "Large event venue",
  "capacity": 1000
}
```

### Create Seat – POST `/api/v1/admin/venues/{id}/seats`

Request:

```json
{
  "seatNumber": "A01",
  "rowName": "A",
  "seatType": "STANDARD",
  "positionX": 1,
  "positionY": 1
}
```

### Delete Seat – DELETE `/api/v1/admin/venues/{venueId}/seats/{seatId}`

Chỉ xóa ghế khi chưa được sử dụng trong sự kiện nào. Nếu đã có lịch sử sử dụng, chuyển `isActive` thành `false`.

## 8. Quy tắc nghiệp vụ và phân quyền chung

### 8.1. Phân quyền

| Vai trò | Quyền |
|---|---|
| Guest | Xem danh sách sự kiện, chi tiết sự kiện và sơ đồ ghế |
| CUSTOMER | Các quyền của Guest, giữ ghế, đặt vé, xem/hủy đơn và xem vé của bản thân |
| ADMIN | Quản lý người dùng, địa điểm, ghế, sự kiện và xác thực vé |

### 8.2. Quy tắc dữ liệu

- Backend lấy User ID từ JWT, không tin tưởng User ID do Frontend gửi.
- Không trả về mật khẩu hoặc password hash.
- Giá vé và tổng tiền do Backend tính toán.
- Redis giữ ghế tạm thời trong 300 giây.
- PostgreSQL lưu trạng thái ghế `AVAILABLE` hoặc `BOOKED`; không lưu `HELD`.
- Một EventSeat chỉ được đặt thành công một lần.
- Mỗi BookingDetail tương ứng với một Ticket.
- Mỗi Ticket có `ticketCode` duy nhất để tạo QR.
- Khi hủy Booking, các Ticket chưa sử dụng chuyển thành `VOID`.

### 8.3. Quy tắc xử lý lỗi

Response lỗi:

```json
{
  "success": false,
  "message": "One or more seats are unavailable",
  "data": {
    "unavailableSeatIds": [102]
  },
  "timestamp": "2026-11-15T10:00:00"
}
```

Một số lỗi nghiệp vụ phổ biến:

| Tình huống | HTTP Status |
|---|---|
| Email đã tồn tại | 409 |
| Sai thông tin đăng nhập | 401 |
| Không có quyền truy cập | 403 |
| Không tìm thấy tài nguyên | 404 |
| Ghế đã được giữ hoặc đặt | 409 |
| Thời gian giữ ghế đã hết | 409 |
| Vé đã được sử dụng | 409 |
| Không thể hủy đơn | 422 |

---

**Lưu ý:** Đây là API Contract thống nhất giữa Frontend và Backend. Các Request/Response mẫu là cấu trúc dữ liệu dự kiến; khi triển khai, hai bên cần giữ đúng tên trường, kiểu dữ liệu và quy tắc nghiệp vụ đã thống nhất.