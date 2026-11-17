
package com.ticketbooking.dto.eventSeat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateEventSeatPricesRequest(

        @NotEmpty(message = "Seat price list must not be empty")
        @Size(max = 500, message = "Cannot update more than 500 seats at once")
        List<@Valid UpdateEventSeatPriceRequest> seatPrices

) {
}
