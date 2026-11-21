package com.ticketbooking.dto.eventSeat;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateEventSeatPricesRequest(

        @NotNull(message = "Standard price is required")
        @DecimalMin(value = "0.0", inclusive = false,
                message = "Standard price must be greater than 0")
        BigDecimal standardPrice,

        @NotNull(message = "VIP price is required")
        @DecimalMin(value = "0.0", inclusive = false,
                message = "VIP price must be greater than 0")
        BigDecimal vipPrice

) {
}