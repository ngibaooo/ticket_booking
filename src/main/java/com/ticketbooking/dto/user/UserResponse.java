
package com.ticketbooking.dto.user;

import com.ticketbooking.enums.UserRole;
import com.ticketbooking.enums.UserStatus;

import java.time.LocalDateTime;

public record UserResponse(

        Long id,

        String fullName,

        String email,

        String phone,

        UserRole role,

        UserStatus status,

        LocalDateTime createdAt

) {
}
