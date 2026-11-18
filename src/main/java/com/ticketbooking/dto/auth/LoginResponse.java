package com.ticketbooking.dto.auth;

import com.ticketbooking.enums.UserRole;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String fullName,
        String email,
        UserRole role
) {
}