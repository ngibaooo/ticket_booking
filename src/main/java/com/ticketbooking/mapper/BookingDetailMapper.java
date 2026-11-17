
package com.ticketbooking.mapper;

import com.ticketbooking.dto.bookingDetail.BookingDetailResponse;
import com.ticketbooking.entity.BookingDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingDetailMapper {

    @Mapping(target = "eventSeatId", source = "eventSeat.id")
    @Mapping(target = "seatNumber", source = "eventSeat.seat.seatNumber")
    @Mapping(target = "rowName", source = "eventSeat.seat.rowName")
    @Mapping(target = "seatType", source = "eventSeat.seat.seatType")
    BookingDetailResponse toResponse(BookingDetail bookingDetail);
}
