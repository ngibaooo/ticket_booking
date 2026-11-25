
package com.ticketbooking.service.seat;

import com.ticketbooking.dto.seat.CreateSeatRequest;
import com.ticketbooking.dto.seat.SeatResponse;
import com.ticketbooking.dto.seat.UpdateSeatRequest;

import java.util.List;

public interface SeatService {

    List<SeatResponse> getVenueSeats(Long venueId);

    SeatResponse createSeat(
            Long venueId,
            CreateSeatRequest request
    );

    SeatResponse updateSeat(
            Long venueId,
            Long seatId,
            UpdateSeatRequest request
    );

    void deleteSeat(Long venueId, Long seatId);
}
