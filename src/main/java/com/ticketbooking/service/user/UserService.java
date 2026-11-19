
package com.ticketbooking.service.user;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UserResponse;

public interface UserService {

    UserResponse updateCurrentUser(
            Long userId,
            UpdateUserRequest request
    );

}
