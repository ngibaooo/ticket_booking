package com.ticketbooking.dto.auth;

import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.enums.UserRole;

public record LoginResponse(
        String accessToken,
        String tokenType,
//      Tái sd UserResponse DTO - có chứa đầy đủ các trường cần thiết cho LoginResponse
        UserResponse user
) {
}