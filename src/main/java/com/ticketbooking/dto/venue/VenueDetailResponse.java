package com.ticketbooking.dto.venue;

import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.dto.seat.SeatResponse;
import com.ticketbooking.enums.VenueStatus;

import java.time.LocalDateTime;
import java.util.List;

public record VenueDetailResponse(
        Long id,
        String venueName,
        String address,
        String description,
        Integer capacity,
        VenueStatus status,
        LocalDateTime createdAt,
        List<SeatResponse> seats,
        List<EventResponse> events
) {
}