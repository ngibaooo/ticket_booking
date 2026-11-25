package com.ticketbooking.dto.ticket;

import jakarta.validation.constraints.NotBlank;

public record ValidateTicketRequest(

        @NotBlank(message = "Ticket code is required")
        String ticketCode

) {}