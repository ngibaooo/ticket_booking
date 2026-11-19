
package com.ticketbooking.controller.user;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.security.CustomUserDetails;
import com.ticketbooking.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            Authentication authentication,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();

        UserResponse response = userService.updateCurrentUser(
                userDetails.getId(),
                request
        );

        return ResponseEntity.ok(response);
    }
}
