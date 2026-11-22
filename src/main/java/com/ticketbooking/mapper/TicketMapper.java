package com.ticketbooking.mapper;

import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(target = "bookingDetailId", source = "bookingDetail.id")
    @Mapping(target = "eventSeatId", source = "bookingDetail.eventSeat.id")
    @Mapping(target = "seatNumber", source = "bookingDetail.eventSeat.seat.seatNumber")
    @Mapping(target = "price", source = "bookingDetail.price")
    TicketResponse toResponse(Ticket ticket);
}