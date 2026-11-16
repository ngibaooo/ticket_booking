
package com.ticketbooking.repository;

import com.ticketbooking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingDetailRepository
        extends JpaRepository<BookingDetail, Long> {

    // Lấy danh sách chi tiết của một booking
    List<BookingDetail> findByBookingId(Long bookingId);

    // Tìm chi tiết booking theo ID và ID booking
    Optional<BookingDetail> findByIdAndBookingId(
            Long bookingDetailId,
            Long bookingId
    );

    // Kiểm tra ghế thuộc một booking đã tồn tại chưa
    boolean existsByBookingIdAndEventSeatId(
            Long bookingId,
            Long eventSeatId
    );
}
