package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.dto.ticket.ValidateTicketRequest;
import com.ticketbooking.service.ticket.TicketService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/tickets")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketController {

    private final TicketService ticketService;

    public AdminTicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/validate")
    public TicketResponse validateTicket(
            @Valid @RequestBody ValidateTicketRequest request
    ) {
        return ticketService.validateTicket(request.ticketCode());
    }
}