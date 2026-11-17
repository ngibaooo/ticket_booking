
package com.ticketbooking.dto.bookingdetail;

import java.math.BigDecimal;

public record BookingDetailResponse(
        Long id,
        Long eventSeatId,
        String seatNumber,
        String rowName,
        String seatType,
        BigDecimal price
) {}
