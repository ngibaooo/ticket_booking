
package com.ticketbooking.mapper;

import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(
            target = "bookingDetailId",
            source = "bookingDetail.id"
    )
    TicketResponse toResponse(Ticket ticket);
}
