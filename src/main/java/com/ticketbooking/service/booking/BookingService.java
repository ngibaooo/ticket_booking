package com.ticketbooking.service.booking;

import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.entity.Booking;

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
    BookingResponse confirmBooking(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    );
}
