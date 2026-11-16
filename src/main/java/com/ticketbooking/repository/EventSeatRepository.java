
package com.ticketbooking.repository;

import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.enums.EventSeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventSeatRepository extends JpaRepository<EventSeat, Long> {

    // Lấy tất cả ghế thuộc một sự kiện
    List<EventSeat> findByEventId(Long eventId);

    // Lấy ghế theo sự kiện và trạng thái
    List<EventSeat> findByEventIdAndStatus(
            Long eventId,
            EventSeatStatus status
    );

    // Tìm ghế theo ID và ID sự kiện
    Optional<EventSeat> findByIdAndEventId(
            Long eventSeatId,
            Long eventId
    );

    // Kiểm tra ghế vật lý đã được thêm vào sự kiện chưa
    boolean existsByEventIdAndSeatId(
            Long eventId,
            Long seatId
    );

    // Lấy nhiều ghế theo danh sách ID trong một sự kiện
    List<EventSeat> findByEventIdAndIdIn(
            Long eventId,
            Collection<Long> eventSeatIds
    );
}
