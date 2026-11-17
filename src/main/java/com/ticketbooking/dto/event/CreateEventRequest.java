
package com.ticketbooking.dto.event;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateEventRequest(

        @NotNull(message = "Venue ID is required")
        Long venueId,

        @NotBlank(message = "Event name is required")
        @Size(max = 150, message = "Event name must not exceed 150 characters")
        String eventName,

        String description,

        @NotNull(message = "Start time is required")
        @Future(message = "Start time must be in the future")
        LocalDateTime startTime,

        @NotNull(message = "End time is required")
        LocalDateTime endTime,

        @NotNull(message = "Sale start time is required")
        LocalDateTime saleStartTime,

        @NotNull(message = "Sale end time is required")
        LocalDateTime saleEndTime,

        @Size(max = 500, message = "Banner URL must not exceed 500 characters")
        String bannerUrl

) {
}
