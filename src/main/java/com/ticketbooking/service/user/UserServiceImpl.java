
package com.ticketbooking.service.user;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UpdateUserStatusRequest;
import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.entity.User;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ForbiddenException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.UserMapper;
import com.ticketbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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


    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {

        return userRepository.findAll(pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(
            Long userId,
            UpdateUserStatusRequest request,
            Long currentAdminId
    ) {
        // 1. Kiểm tra request
        if (request == null || request.status() == null) {
            throw new BadRequestException("Status is required");
        }

        // 2. Kiểm tra ID người dùng
        if (userId == null || userId <= 0) {
            throw new BadRequestException("Invalid user ID");
        }

        // 3. Không cho Admin tự thay đổi trạng thái tài khoản
        if (currentAdminId != null && currentAdminId.equals(userId)) {
            throw new ForbiddenException(
                    "You cannot change your own account status"
            );
        }

        // 4. Tìm người dùng cần cập nhật
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        // 5. Kiểm tra trạng thái hiện tại
        if (user.getStatus() == request.status()) {
            return userMapper.toResponse(user);
        }

        // 6. Cập nhật trạng thái
        user.setStatus(request.status());

        // 7. Lưu thay đổi
        User updatedUser = userRepository.save(user);

        return userMapper.toResponse(updatedUser);
    }

}
