
package com.ticketbooking.repository;

import com.ticketbooking.entity.Booking;
import com.ticketbooking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Lấy danh sách booking của một người dùng
    Page<Booking> findByUserId(
            Long userId,
            Pageable pageable
    );
    // Lấy booking theo mã booking
    Optional<Booking> findByBookingCode(String bookingCode);

    // Lấy danh sách booking theo trạng thái
    List<Booking> findByStatus(BookingStatus status);

    // Lấy danh sách booking của người dùng theo trạng thái
    List<Booking> findByUserIdAndStatus(
            Long userId,
            BookingStatus status
    );
    Optional<Booking> findByIdAndUserId(Long id, Long userId);
}
