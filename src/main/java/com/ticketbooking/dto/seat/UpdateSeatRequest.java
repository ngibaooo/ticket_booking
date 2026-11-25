
package com.ticketbooking.dto.seat;

import com.ticketbooking.enums.SeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateSeatRequest(

//        @NotBlank(message = "Seat number is required")
        @Size(max = 10, message = "Seat number must not exceed 10 characters")
        String seatNumber,

//        @NotBlank(message = "Row name is required")
        @Size(max = 10, message = "Row name must not exceed 10 characters")
        String rowName,

//        @NotNull(message = "Seat type is required")
        SeatType seatType,

        @PositiveOrZero(message = "Position X must be zero or greater")
        Integer positionX,

        @PositiveOrZero(message = "Position Y must be zero or greater")
        Integer positionY,

//        @NotNull(message = "Active status is required")
        Boolean isActive

) {
}
