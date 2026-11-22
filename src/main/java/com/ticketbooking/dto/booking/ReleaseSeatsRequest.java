package com.ticketbooking.dto.booking;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReleaseSeatsRequest(

        @NotEmpty(message = "Seat list must not be empty")
        @Size(max = 10, message = "Cannot release more than 10 seats at once")
        List<
                @NotNull(message = "Event seat ID cannot be null")
                @Positive(message = "Event seat ID must be positive")
                        Long
                > eventSeatIds
) {}