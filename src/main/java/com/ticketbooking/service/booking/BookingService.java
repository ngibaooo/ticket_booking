package com.ticketbooking.service.booking;

import java.util.List;

public interface BookingService {

    void holdSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    );
    void releaseSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    );
}
