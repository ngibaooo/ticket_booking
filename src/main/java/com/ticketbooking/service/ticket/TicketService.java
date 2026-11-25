package com.ticketbooking.service.ticket;

import com.ticketbooking.dto.ticket.TicketResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TicketService {

    TicketResponse getMyTicket(Long ticketId, Long customerId);
    byte[] getMyTicketQr(Long ticketId, Long customerId);
    TicketResponse validateTicket(String ticketCode);
    Page<TicketResponse> getMyTickets(Long customerId, Pageable pageable);
}