package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.booking.BookingHistoryResponse;
import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.service.booking.BookingService;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // GET /api/v1/admin/bookings
    @GetMapping
    public Page<BookingHistoryResponse> getAllBookings(
            @RequestParam(defaultValue = "0") @PositiveOrZero int page,
            @RequestParam(defaultValue = "10") @Positive int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return bookingService.getAllBookings(pageable);
    }

    // GET /api/v1/admin/bookings/{id}
    @GetMapping("/{id}")
    public BookingResponse getBookingDetail(
            @PathVariable
            @Positive(message = "Booking ID must be greater than 0")
            Long id
    ) {
        return bookingService.getAdminBookingDetail(id);
    }
}