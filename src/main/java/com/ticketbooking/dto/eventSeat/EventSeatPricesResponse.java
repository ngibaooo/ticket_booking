package com.ticketbooking.dto.eventSeat;

import java.math.BigDecimal;

public record EventSeatPricesResponse(
        BigDecimal standardPrice,
        BigDecimal vipPrice
) {
}