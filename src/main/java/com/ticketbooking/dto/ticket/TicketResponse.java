package com.ticketbooking.dto.ticket;

import com.ticketbooking.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        Long bookingDetailId,
        String ticketCode,
        Long eventSeatId,
        String seatNumber,
        BigDecimal price,
        TicketStatus status,
        LocalDateTime issuedAt,
        LocalDateTime usedAt
) {}