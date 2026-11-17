
package com.ticketbooking.dto.bookingDetail;

import java.math.BigDecimal;

public record BookingDetailResponse(
        Long id,
        Long eventSeatId,
        String seatNumber,
        String rowName,
        String seatType,
        BigDecimal price
) {}
