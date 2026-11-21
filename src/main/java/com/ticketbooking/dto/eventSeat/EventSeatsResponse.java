package com.ticketbooking.dto.eventSeat;

import java.util.List;

public record EventSeatsResponse(

        Long eventId,

        String eventName,

        List<EventSeatResponse> seats

) {
}