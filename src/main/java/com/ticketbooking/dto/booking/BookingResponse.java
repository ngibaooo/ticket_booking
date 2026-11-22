
package com.ticketbooking.dto.booking;

import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingCode,
        Long userId,
        Long eventId,
        String eventName,
        BigDecimal totalAmount,
        BookingStatus status,
        LocalDateTime createdAt,
        List<TicketResponse> tickets
) {
}
