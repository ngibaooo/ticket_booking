
package com.ticketbooking.controller.booking;

import com.ticketbooking.dto.booking.*;
import com.ticketbooking.security.CustomUserDetails;
import com.ticketbooking.service.booking.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/bookings")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // Customer giữ ghế trong 5 phút
    @PostMapping("/{eventId}/hold-seats")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void holdSeats(

            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long eventId,

            @Valid
            @RequestBody
            HoldSeatsRequest request,

            @AuthenticationPrincipal
            CustomUserDetails userDetails

    ) {
        bookingService.holdSeats(
                eventId,
                request.eventSeatIds(),
                userDetails.getId()
        );
    }
    @DeleteMapping("/{eventId}/hold-seats")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void releaseSeats(
            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long eventId,

            @Valid @RequestBody ReleaseSeatsRequest request,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        bookingService.releaseSeats(
                eventId,
                request.eventSeatIds(),
                userDetails.getId()
        );
    }
    // Customer xác nhận đặt vé
    @PostMapping("/{eventId}/confirm-booking")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse confirmBooking(

            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long eventId,

            @Valid
            @RequestBody
            ConfirmBookingRequest request,

            @AuthenticationPrincipal
            CustomUserDetails userDetails

    ) {
        return bookingService.confirmBooking(
                eventId,
                request.eventSeatIds(),
                userDetails.getId()
        );
    }
    @GetMapping
    public Page<BookingHistoryResponse> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return bookingService.getMyBookings(
                userDetails.getId(),
                pageable
        );
    }
    // Customer xem chi tiết booking của mình
    @GetMapping("/{id}")
    public BookingResponse getBookingDetail(

            @PathVariable
            @Positive(message = "Booking ID must be greater than 0")
            Long id,

            @AuthenticationPrincipal
            CustomUserDetails userDetails

    ) {
        return bookingService.getBookingDetail(
                id,
                userDetails.getId()
        );
    }
    @PutMapping("/{id}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable
            @Positive(message = "Booking ID must be greater than 0")
            Long id,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return bookingService.cancelBooking(id, userDetails.getId());
    }
    @GetMapping("/hold-seats")
    public Set<Long> getMyHeldSeats(
            @RequestParam
            @Positive(message = "Event ID must be greater than 0")
            Long eventId,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return bookingService.getMyHeldSeats(
                eventId,
                userDetails.getId()
        );
    }
}
