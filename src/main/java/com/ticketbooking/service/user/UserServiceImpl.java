
package com.ticketbooking.service.user;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.entity.User;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.UserMapper;
import com.ticketbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserResponse updateCurrentUser(
            Long userId,
            UpdateUserRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        if (request.fullName() != null) {
            if (request.fullName().isBlank()) {
                throw new BadRequestException("Full name cannot be blank");
            }

            user.setFullName(request.fullName().trim());
        }

        if (request.phone() != null) {
            if (request.phone().isBlank()) {
                throw new BadRequestException("Phone cannot be blank");
            }

            user.setPhone(request.phone().trim());
        }
        if (request.fullName() == null && request.phone() == null) {
            throw new BadRequestException("At least one field must be provided");
        }

        User updatedUser = userRepository.save(user);

        return userMapper.toResponse(updatedUser);
    }
}
