package com.ticketbooking.dto.booking;

import com.ticketbooking.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingHistoryResponse(
        Long id,
        String bookingCode,
        Long eventId,
        String eventName,
        BigDecimal totalAmount,
        BookingStatus status,
        LocalDateTime createdAt
) {
}