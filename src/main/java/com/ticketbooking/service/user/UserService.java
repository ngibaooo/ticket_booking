
package com.ticketbooking.service.user;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse updateCurrentUser(
            Long userId,
            UpdateUserRequest request
    );

    Page<UserResponse> getAllUsers(Pageable pageable);

}
