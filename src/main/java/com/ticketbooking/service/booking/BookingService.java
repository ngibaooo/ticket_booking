package com.ticketbooking.service.booking;

import com.ticketbooking.dto.booking.BookingHistoryResponse;
import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

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
    Page<BookingHistoryResponse> getMyBookings(
            Long customerId,
            Pageable pageable
    );
    BookingResponse getBookingDetail(Long bookingId, Long customerId);
    BookingResponse cancelBooking(Long bookingId, Long customerId);

    Page<BookingHistoryResponse> getAllBookings(Pageable pageable);

    BookingResponse getAdminBookingDetail(Long bookingId);

    Set<Long> getMyHeldSeats(Long eventId, Long customerId);
}
