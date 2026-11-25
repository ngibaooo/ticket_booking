
package com.ticketbooking.repository;

import com.ticketbooking.entity.Ticket;
import com.ticketbooking.enums.TicketStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Tìm vé theo mã ticketCode
    Optional<Ticket> findByTicketCode(String ticketCode);

    // Lấy danh sách vé theo trạng thái
    List<Ticket> findByStatus(TicketStatus status);

    // Tìm vé theo BookingDetail ID
    Optional<Ticket> findByBookingDetailId(Long bookingDetailId);

    // Lấy danh sách vé thuộc một booking
    List<Ticket> findByBookingDetailBookingId(Long bookingId);

    // Kiểm tra ticketCode đã tồn tại chưa
    boolean existsByTicketCode(String ticketCode);

    Page<Ticket> findByBookingDetail_Booking_User_Id(
            Long customerId,
            Pageable pageable
    );
    Optional<Ticket> findByIdAndBookingDetail_Booking_User_Id(
            Long ticketId,
            Long customerId
    );
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT t
    FROM Ticket t
    WHERE t.ticketCode = :ticketCode
    """)
    Optional<Ticket> findByTicketCodeForUpdate(
            @Param("ticketCode") String ticketCode
    );
}
