
package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.user.UpdateUserStatusRequest;
import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.security.CustomUserDetails;
import com.ticketbooking.service.user.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        Page<UserResponse> response = userService.getAllUsers(pageable);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable("id") @Positive Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        CustomUserDetails adminDetails =
                (CustomUserDetails) authentication.getPrincipal();

        UserResponse response = userService.updateUserStatus(
                id,
                request,
                adminDetails.getId()
        );

        return ResponseEntity.ok(response);
    }
}
