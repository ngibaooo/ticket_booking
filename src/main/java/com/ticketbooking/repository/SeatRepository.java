
package com.ticketbooking.repository;

import com.ticketbooking.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Lấy danh sách ghế thuộc một địa điểm
    List<Seat> findByVenueId(Long venueId);

    // Lấy danh sách ghế đang hoạt động thuộc một địa điểm
    List<Seat> findByVenueIdAndIsActiveTrue(Long venueId);

    // Kiểm tra số ghế đã tồn tại trong một địa điểm
    boolean existsByVenueIdAndSeatNumber(Long venueId, String seatNumber);

    // Tìm ghế theo ID và ID địa điểm
    Optional<Seat> findByIdAndVenueId(Long seatId, Long venueId);
}
