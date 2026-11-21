package com.ticketbooking.dto.event;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SeatPricesRequest(

        @NotNull(message = "Standard price is required")
        @DecimalMin(
                value = "0.01",
                message = "Standard price must be greater than 0"
        )
        @Digits(
                integer = 12,
                fraction = 2,
                message = "Standard price must have at most 12 integer digits and 2 decimal places"
        )
        BigDecimal standardPrice,

        @NotNull(message = "VIP price is required")
        @DecimalMin(
                value = "0.01",
                message = "VIP price must be greater than 0"
        )
        @Digits(
                integer = 12,
                fraction = 2,
                message = "VIP price must have at most 12 integer digits and 2 decimal places"
        )
        BigDecimal vipPrice
) {}