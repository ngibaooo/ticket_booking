
package com.ticketbooking.dto.eventSeat;

import com.ticketbooking.enums.EventSeatStatus;
import com.ticketbooking.enums.SeatType;

import java.math.BigDecimal;

public record EventSeatResponse(

        Long id,

        Long seatId,

        String seatNumber,

        String rowName,

        SeatType seatType,

        Integer positionX,

        Integer positionY,

        BigDecimal price,

        EventSeatStatus status,

        Boolean isActive,

        Boolean isHeld

) {
}
