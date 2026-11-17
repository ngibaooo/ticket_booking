
package com.ticketbooking.dto.seat;

import com.ticketbooking.enums.SeatType;

public record SeatResponse(

        Long id,

        Long venueId,

        String seatNumber,

        String rowName,

        SeatType seatType,

        Integer positionX,

        Integer positionY,

        Boolean isActive

) {
}
