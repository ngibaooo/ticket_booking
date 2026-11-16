
package com.ticketbooking.repository;

import com.ticketbooking.entity.Ticket;
import com.ticketbooking.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
