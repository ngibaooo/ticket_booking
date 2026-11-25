
package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.seat.CreateSeatRequest;
import com.ticketbooking.dto.seat.SeatResponse;
import com.ticketbooking.dto.seat.UpdateSeatRequest;
import com.ticketbooking.service.seat.SeatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/venues/{venueId}/seats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSeatController {

    private final SeatService seatService;

    public AdminSeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    // GET: Xem sơ đồ ghế vật lý
    @GetMapping
    public List<SeatResponse> getVenueSeats(
            @PathVariable Long venueId
    ) {
        return seatService.getVenueSeats(venueId);
    }

    // POST: Thêm ghế vật lý
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeatResponse createSeat(
            @PathVariable Long venueId,
            @Valid @RequestBody CreateSeatRequest request
    ) {
        return seatService.createSeat(venueId, request);
    }

    // PUT: Cập nhật ghế vật lý
    @PutMapping("/{seatId}")
    public SeatResponse updateSeat(
            @PathVariable Long venueId,
            @PathVariable Long seatId,
            @Valid @RequestBody UpdateSeatRequest request
    ) {
        return seatService.updateSeat(venueId, seatId, request);
    }

    // DELETE: Xóa ghế vật lý
    @DeleteMapping("/{seatId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSeat(
            @PathVariable Long venueId,
            @PathVariable Long seatId
    ) {
        seatService.deleteSeat(venueId, seatId);
    }
}
