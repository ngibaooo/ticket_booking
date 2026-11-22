
package com.ticketbooking.controller.booking;

import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.dto.booking.ConfirmBookingRequest;
import com.ticketbooking.dto.booking.HoldSeatsRequest;
import com.ticketbooking.dto.booking.ReleaseSeatsRequest;
import com.ticketbooking.security.CustomUserDetails;
import com.ticketbooking.service.booking.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
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
}
