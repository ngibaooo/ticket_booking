
package com.ticketbooking.mapper;

import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "eventId", source = "event.id")
    BookingResponse toResponse(Booking booking);
}
