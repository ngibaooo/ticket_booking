// Synthetic demonstration data aligned with admin console venues & backend DTO shapes.

function buildAuditoriumSeats(eventId, rowsConfig, bookedSet, heldSet, startId) {
  const seats = [];
  let nextId = startId;
  rowsConfig.forEach((cfg, rowIdx) => {
    for (let col = 1; col <= cfg.cols; col++) {
      // Leave a natural center aisle between col 6 and 7 when cols >= 10
      const positionX = cfg.cols >= 10 && col > Math.floor(cfg.cols / 2) ? col + 1 : col;
      const seatNumber = `${cfg.row}${String(col).padStart(2, "0")}`;
      const isBooked = bookedSet.has(seatNumber);
      const isHeld = !isBooked && heldSet.has(seatNumber);
      seats.push({
        id: nextId,
        seatId: nextId,
        seatNumber,
        rowName: cfg.row,
        seatType: cfg.type,
        positionX,
        positionY: rowIdx + 1,
        price: cfg.price,
        status: isBooked ? "BOOKED" : "AVAILABLE",
        isActive: !(cfg.row === "H" && col >= cfg.cols - 1),
        isHeld
      });
      nextId += 1;
    }
  });
  return seats;
}

export function createInitialDemoState() {
  const events = [
    {
      id: 101,
      venueId: 1,
      venueName: "Nhà hát Thành phố — TP. Hồ Chí Minh",
      eventName: "Đêm nhạc bên sông: Thanh âm Mùa Đông",
      description:
        "Đêm hòa nhạc acoustic quy tụ dàn nhạc dây 18 nhạc công và các nghệ sĩ độc tấu giữa không gian Nhà hát Thành phố.\n\nCửa đón khách mở từ 18:45. Hệ thống hỗ trợ chọn ghế trực tiếp theo sơ đồ khán phòng, giữ chỗ tạm thời 5 phút qua Redis và xuất vé QR ngay sau khi xác nhận.",
      startTime: "2026-12-20T19:30:00",
      endTime: "2026-12-20T22:15:00",
      saleStartTime: "2026-11-10T09:00:00",
      saleEndTime: "2026-12-20T18:00:00",
      bannerUrl: "/assets/event-riverside.svg",
      status: "OPEN",
      createdAt: "2026-11-05T08:00:00",
      updatedAt: "2026-11-18T10:15:00"
    },
    {
      id: 102,
      venueId: 1,
      venueName: "Nhà hát Thành phố — TP. Hồ Chí Minh",
      eventName: "Hòa nhạc Giao hưởng Mùa Lễ Hội 2026",
      description:
        "Chương trình giao hưởng thính phòng trình diễn các tác phẩm cổ điển chọn lọc của Tchaikovsky và Mozart.\n\nKhán phòng chia hai hạng ghế: VIP (hàng A–B sát sân khấu) và Standard (hàng C–F). Mỗi tài khoản được giữ tối đa 6 ghế trong một lượt đặt.",
      startTime: "2026-12-28T20:00:00",
      endTime: "2026-12-28T22:30:00",
      saleStartTime: "2026-11-15T09:00:00",
      saleEndTime: "2026-12-28T17:00:00",
      bannerUrl: "/assets/event-symphony.svg",
      status: "OPEN",
      createdAt: "2026-11-08T09:30:00",
      updatedAt: "2026-11-19T14:20:00"
    },
    {
      id: 103,
      venueId: 2,
      venueName: "Cung Văn hóa Hữu nghị — Hà Nội",
      eventName: "Vietnam Cloud & Architecture Summit 2026",
      description:
        "Hội nghị kỹ thuật chuyên sâu về hệ thống phân tán, AWS ECS Fargate, tối ưu Redis cho bài toán đặt chỗ đồng thời cao và quan sát hệ thống với CloudWatch.\n\nBao gồm 6 phiên thảo luận chính, workshop thực hành kiểm thử tải k6 và giao lưu cùng diễn giả.",
      startTime: "2027-01-12T08:30:00",
      endTime: "2027-01-12T17:00:00",
      saleStartTime: "2026-11-20T08:00:00",
      saleEndTime: "2027-01-11T23:00:00",
      bannerUrl: "/assets/event-techconf.svg",
      status: "OPEN",
      createdAt: "2026-11-12T11:00:00",
      updatedAt: "2026-11-20T09:00:00"
    },
    {
      id: 104,
      venueId: 2,
      venueName: "Cung Văn hóa Hữu nghị — Hà Nội",
      eventName: "Đêm kịch nói: Phố Cũ Cuối Năm",
      description:
        "Vở chính kịch đương đại khắc họa nhịp sống Hà Nội dịp giao mùa với thiết kế sân khấu tối giản và ánh sáng trực tiếp.\n\nSự kiện chuẩn bị mở bán vé trong thời gian tới — bạn vẫn có thể xem trước sơ đồ ghế và giá vé dự kiến.",
      startTime: "2027-01-25T19:45:00",
      endTime: "2027-01-25T22:00:00",
      saleStartTime: "2026-12-05T10:00:00",
      saleEndTime: "2027-01-25T18:00:00",
      bannerUrl: "/assets/event-symphony.svg",
      status: "UPCOMING",
      createdAt: "2026-11-14T15:00:00",
      updatedAt: "2026-11-20T16:40:00"
    }
  ];

  const seatMaps = {
    101: buildAuditoriumSeats(
      101,
      [
        { row: "A", cols: 12, type: "VIP", price: 650000 },
        { row: "B", cols: 12, type: "VIP", price: 650000 },
        { row: "C", cols: 12, type: "STANDARD", price: 420000 },
        { row: "D", cols: 12, type: "STANDARD", price: 420000 },
        { row: "E", cols: 12, type: "STANDARD", price: 350000 },
        { row: "F", cols: 12, type: "STANDARD", price: 350000 },
        { row: "G", cols: 12, type: "STANDARD", price: 280000 },
        { row: "H", cols: 12, type: "STANDARD", price: 280000 }
      ],
      new Set([
        "A05", "A06", "A07", "A08",
        "B04", "B05", "B06", "B07", "B08",
        "C05", "C06", "C07", "D06", "D07", "E05", "E06"
      ]),
      new Set(["A04", "B09", "C08"]),
      1001
    ),
    102: buildAuditoriumSeats(
      102,
      [
        { row: "A", cols: 10, type: "VIP", price: 850000 },
        { row: "B", cols: 10, type: "VIP", price: 850000 },
        { row: "C", cols: 10, type: "STANDARD", price: 520000 },
        { row: "D", cols: 10, type: "STANDARD", price: 520000 },
        { row: "E", cols: 10, type: "STANDARD", price: 390000 },
        { row: "F", cols: 10, type: "STANDARD", price: 390000 }
      ],
      new Set(["A04", "A05", "A06", "B05", "B06", "C04", "C05"]),
      new Set(["B04", "D05"]),
      2001
    ),
    103: buildAuditoriumSeats(
      103,
      [
        { row: "A", cols: 10, type: "VIP", price: 550000 },
        { row: "B", cols: 10, type: "VIP", price: 550000 },
        { row: "C", cols: 10, type: "STANDARD", price: 250000 },
        { row: "D", cols: 10, type: "STANDARD", price: 250000 },
        { row: "E", cols: 10, type: "STANDARD", price: 250000 },
        { row: "F", cols: 10, type: "STANDARD", price: 180000 }
      ],
      new Set(["A01", "A02", "A05", "A06", "C03", "C04", "C05"]),
      new Set(["B05", "B06"]),
      3001
    ),
    104: buildAuditoriumSeats(
      104,
      [
        { row: "A", cols: 10, type: "VIP", price: 480000 },
        { row: "B", cols: 10, type: "STANDARD", price: 320000 },
        { row: "C", cols: 10, type: "STANDARD", price: 320000 },
        { row: "D", cols: 10, type: "STANDARD", price: 240000 }
      ],
      new Set(),
      new Set(),
      4001
    )
  };

  const demoUser = {
    id: 901,
    fullName: "Nguyễn Minh Khang",
    email: "khachhang@venha.vn",
    password: "Password123",
    phone: "0901234567",
    role: "CUSTOMER",
    status: "ACTIVE",
    createdAt: "2026-11-01T09:00:00"
  };

  const bookings = [
    {
      id: 5001,
      bookingCode: "BK-20261122-000108",
      userId: 901,
      eventId: 101,
      eventName: "Đêm nhạc bên sông: Thanh âm Mùa Đông",
      venueName: "Nhà hát Thành phố — TP. Hồ Chí Minh",
      startTime: "2026-12-20T19:30:00",
      totalAmount: 1300000,
      status: "CONFIRMED",
      createdAt: "2026-11-22T14:25:00",
      tickets: [
        {
          id: 8001,
          bookingDetailId: 7001,
          ticketCode: "TK-9A4F2C81",
          eventSeatId: 1005,
          seatNumber: "A05",
          price: 650000,
          status: "VALID",
          issuedAt: "2026-11-22T14:25:00",
          usedAt: null
        },
        {
          id: 8002,
          bookingDetailId: 7002,
          ticketCode: "TK-9A4F2C82",
          eventSeatId: 1006,
          seatNumber: "A06",
          price: 650000,
          status: "VALID",
          issuedAt: "2026-11-22T14:25:00",
          usedAt: null
        }
      ]
    }
  ];

  return {
    users: [demoUser],
    events,
    seatMaps,
    holds: {}, // key: `${eventId}:${eventSeatId}` -> { userId, expiresAt }
    bookings,
    nextUserId: 902,
    nextBookingId: 5002,
    nextTicketId: 8003
  };
}
