package com.ticketbooking.controller.ticket;

import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.security.CustomUserDetails;
import com.ticketbooking.service.ticket.TicketService;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
@Validated
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public Page<TicketResponse> getMyTickets(
            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10")
            @Positive(message = "Page size must be greater than 0")
            int size,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "issuedAt")
        );

        return ticketService.getMyTickets(
                userDetails.getId(),
                pageable
        );
    }
    @GetMapping("/{id}")
    public TicketResponse getMyTicket(
            @PathVariable
            @Positive(message = "Ticket ID must be greater than 0")
            Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ticketService.getMyTicket(id, userDetails.getId());
    }
    @GetMapping("/{id}/qr")
    public ResponseEntity<byte[]> getTicketQr(
            @PathVariable
            @Positive(message = "Ticket ID must be greater than 0")
            Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        byte[] qrImage = ticketService.getMyTicketQr(
                id,
                userDetails.getId()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrImage);
    }
}