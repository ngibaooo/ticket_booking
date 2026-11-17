
package com.ticketbooking.dto.eventSeat;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateEventSeatPriceRequest(

        @NotNull(message = "Event seat ID is required")
        Long eventSeatId,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = false,
                message = "Price must be greater than 0")
        BigDecimal price

) {
}
