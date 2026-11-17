
package com.ticketbooking.dto.event;

import com.ticketbooking.enums.EventStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateEventStatusRequest(

        @NotNull(message = "Event status is required")
        EventStatus status

) {
}
