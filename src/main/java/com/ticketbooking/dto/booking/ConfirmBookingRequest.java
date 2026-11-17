
package com.ticketbooking.dto.booking;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ConfirmBookingRequest(

        @NotNull(message = "Event ID is required")
        @Positive(message = "Event ID must be positive")
        Long eventId

) {
}
