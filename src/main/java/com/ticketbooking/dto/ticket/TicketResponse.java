
package com.ticketbooking.dto.ticket;

import com.ticketbooking.enums.TicketStatus;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        Long bookingDetailId,
        String ticketCode,
        TicketStatus status,
        LocalDateTime issuedAt,
        LocalDateTime usedAt
) {}
