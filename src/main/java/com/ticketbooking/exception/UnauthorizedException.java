package com.ticketbooking.exception;

public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(message);
    }
}