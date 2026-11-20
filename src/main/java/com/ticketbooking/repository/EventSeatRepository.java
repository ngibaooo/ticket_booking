
package com.ticketbooking.repository;

import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.enums.EventSeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    // Lấy danh sách ghế của sự kiện kèm thông tin Seat
    @Query("""
        SELECT es
        FROM EventSeat es
        JOIN FETCH es.seat s
        WHERE es.event.id = :eventId
        ORDER BY s.positionY ASC, s.positionX ASC, s.seatNumber ASC
        """)
    List<EventSeat> findByEventIdWithSeat(
            @Param("eventId") Long eventId
    );

    // Lấy danh sách EventSeat chưa được đặt của một sự kiện
    // Đồng thời fetch Seat để lấy SeatType
    @Query("""
        SELECT es
        FROM EventSeat es
        JOIN FETCH es.seat s
        WHERE es.event.id = :eventId
        AND es.status = :status
        """)
    List<EventSeat> findByEventIdAndStatusWithSeat(
            @Param("eventId") Long eventId,
            @Param("status") EventSeatStatus status
    );
}
