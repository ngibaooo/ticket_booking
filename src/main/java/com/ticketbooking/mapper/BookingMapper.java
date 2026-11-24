package com.ticketbooking.mapper;

import com.ticketbooking.dto.booking.BookingHistoryResponse;
import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.entity.Booking;
import com.ticketbooking.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = TicketMapper.class
)
public interface BookingMapper {

    @Mapping(target = "userId", source = "booking.user.id")
    @Mapping(target = "eventId", source = "booking.event.id")
    @Mapping(target = "eventName", source = "booking.event.eventName")
    @Mapping(target = "tickets", source = "tickets")
    BookingResponse toResponse(
            Booking booking,
            List<Ticket> tickets
    );
    @Mapping(target = "eventId", source = "event.id")
    @Mapping(target = "eventName", source = "event.eventName")
    BookingHistoryResponse toHistoryResponse(Booking booking);
}