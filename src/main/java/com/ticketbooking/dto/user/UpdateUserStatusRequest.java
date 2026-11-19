package com.ticketbooking.dto.user;

import com.ticketbooking.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(

        @NotNull(message = "Status is required")
        UserStatus status

) {}