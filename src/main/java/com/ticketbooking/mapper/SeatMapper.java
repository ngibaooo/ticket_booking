
package com.ticketbooking.mapper;

import com.ticketbooking.dto.seat.SeatResponse;
import com.ticketbooking.dto.seat.UpdateSeatRequest;
import com.ticketbooking.entity.Seat;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface SeatMapper {

    @Mapping(target = "venueId", source = "venue.id")
    @Mapping(target = "isActive", source = "active")
    SeatResponse toResponse(Seat seat);

    @BeanMapping(
            ignoreByDefault = true,
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "seatNumber", source = "seatNumber")
    @Mapping(target = "rowName", source = "rowName")
    @Mapping(target = "seatType", source = "seatType")
    @Mapping(target = "positionX", source = "positionX")
    @Mapping(target = "positionY", source = "positionY")
    @Mapping(target = "active", source = "isActive")
    void updateEntity(
            UpdateSeatRequest request,
            @MappingTarget Seat seat
    );
}
