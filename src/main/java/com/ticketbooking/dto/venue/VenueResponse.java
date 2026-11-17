
package com.ticketbooking.dto.venue;

import com.ticketbooking.enums.VenueStatus;

import java.time.LocalDateTime;

public record VenueResponse(

        Long id,

        String venueName,

        String address,

        String description,

        Integer capacity,

        VenueStatus status,

        LocalDateTime createdAt

) {
}
