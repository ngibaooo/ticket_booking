
package com.ticketbooking.mapper;

import com.ticketbooking.dto.eventSeat.EventSeatResponse;
import com.ticketbooking.entity.EventSeat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventSeatMapper {

    @Mapping(target = "seatId", source = "seat.id")
    @Mapping(target = "seatNumber", source = "seat.seatNumber")
    @Mapping(target = "rowName", source = "seat.rowName")
    @Mapping(target = "seatType", source = "seat.seatType")
    @Mapping(target = "positionX", source = "seat.positionX")
    @Mapping(target = "positionY", source = "seat.positionY")
    @Mapping(target = "isActive", source = "seat.active")
    @Mapping(target = "isHeld", ignore = true)
    EventSeatResponse toResponse(EventSeat eventSeat);
}
