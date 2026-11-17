
package com.ticketbooking.dto.booking;

import java.time.LocalDateTime;
import java.util.List;

public record HoldSeatsResponse(

        Long eventId,

        List<Long> eventSeatIds,

        Integer expiresInSeconds,

        LocalDateTime expiresAt

) {
}
