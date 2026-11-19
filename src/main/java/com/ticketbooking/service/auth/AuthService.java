package com.ticketbooking.service.auth;

import com.ticketbooking.dto.auth.LoginRequest;
import com.ticketbooking.dto.auth.LoginResponse;
import com.ticketbooking.dto.auth.RegisterRequest;
import com.ticketbooking.dto.user.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}