
package com.ticketbooking.dto.event;

import com.ticketbooking.enums.EventStatus;

import java.time.LocalDateTime;

public record EventResponse(

        Long id,

        Long venueId,

        String venueName,

        String eventName,

        String description,

        LocalDateTime startTime,

        LocalDateTime endTime,

        LocalDateTime saleStartTime,

        LocalDateTime saleEndTime,

        String bannerUrl,

        EventStatus status,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
