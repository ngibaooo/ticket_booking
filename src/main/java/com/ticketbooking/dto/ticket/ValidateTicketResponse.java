
package com.ticketbooking.dto.ticket;

import com.ticketbooking.enums.TicketStatus;

public record ValidateTicketResponse(
        String ticketCode,
        TicketStatus status,
        boolean valid,
        String message
) {}
