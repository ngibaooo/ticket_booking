package com.ticketbooking.service.booking;

import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.mapper.BookingMapper;
import com.ticketbooking.repository.BookingDetailRepository;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.EventSeatRepository;
import com.ticketbooking.repository.TicketRepository;
import com.ticketbooking.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.ticketbooking.entity.Booking;
import com.ticketbooking.entity.BookingDetail;
import com.ticketbooking.entity.Event;
import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.entity.Ticket;
import com.ticketbooking.entity.User;
import com.ticketbooking.enums.BookingStatus;
import com.ticketbooking.enums.EventSeatStatus;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.enums.TicketStatus;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ConflictException;
import com.ticketbooking.exception.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
@Service
public class BookingPersistenceService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final BookingMapper bookingMapper;

    public BookingPersistenceService(
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            EventSeatRepository eventSeatRepository,
            BookingMapper bookingMapper
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.bookingMapper = bookingMapper;
    }

    @Transactional
    public BookingResponse confirmBooking(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        // 1. Kiểm tra danh sách ghế
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            throw new BadRequestException("Seat list must not be empty");
        }

        if (new HashSet<>(eventSeatIds).size() != eventSeatIds.size()) {
            throw new BadRequestException("Duplicate seat IDs are not allowed");
        }

        // 2. Tìm Event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Event not found")
                );

        // 3. Kiểm tra thời gian mở bán
        LocalDateTime now = LocalDateTime.now();

        if (event.getStatus() != EventStatus.OPEN) {
            throw new ConflictException("Event is not open for booking");
        }

        if (now.isBefore(event.getSaleStartTime())
                || now.isAfter(event.getSaleEndTime())) {
            throw new ConflictException("Event is not within the sale period");
        }

        // 4. Tìm Customer
        User customer = userRepository.findById(customerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Customer not found")
                );

        // 5. Khóa các ghế trong database
        List<EventSeat> eventSeats =
                eventSeatRepository.findByEventIdAndIdInForUpdate(
                        eventId,
                        eventSeatIds
                );

        // Kiểm tra tất cả ID ghế có thuộc Event không
        if (eventSeats.size() != eventSeatIds.size()) {
            throw new BadRequestException(
                    "One or more seats do not belong to this event"
            );
        }

        // 6. Kiểm tra trạng thái ghế
        for (EventSeat eventSeat : eventSeats) {
            if (eventSeat.getStatus() != EventSeatStatus.AVAILABLE) {
                throw new ConflictException(
                        "One or more seats are no longer available"
                );
            }
        }

        // 7. Tính tổng tiền dựa trên giá trong database
        BigDecimal totalAmount = eventSeats.stream()
                .map(EventSeat::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 8. Tạo Booking
        Booking booking = new Booking(
                generateBookingCode(),
                customer,
                event,
                totalAmount,
                BookingStatus.CONFIRMED
        );

        booking = bookingRepository.save(booking);

        // 9. Tạo BookingDetail và Ticket
        List<BookingDetail> bookingDetails = new ArrayList<>();
        List<Ticket> tickets = new ArrayList<>();

        for (EventSeat eventSeat : eventSeats) {

            // Tạo BookingDetail
            BookingDetail detail = new BookingDetail(
                    booking,
                    eventSeat,
                    eventSeat.getPrice()
            );

            bookingDetails.add(detail);

            // Cập nhật trạng thái ghế
            eventSeat.setStatus(EventSeatStatus.BOOKED);
        }

        // Lưu BookingDetail trước để có ID
        bookingDetails = bookingDetailRepository.saveAll(bookingDetails);

        // Tạo Ticket tương ứng với từng BookingDetail
        for (BookingDetail detail : bookingDetails) {

            Ticket ticket = new Ticket(
                    detail,
                    generateTicketCode(),
                    TicketStatus.VALID
            );

            tickets.add(ticket);
        }

        // 10. Lưu Ticket và cập nhật trạng thái ghế
        ticketRepository.saveAll(tickets);
        eventSeatRepository.saveAll(eventSeats);

        List<Ticket> savedTickets =
                ticketRepository.findByBookingDetailBookingId(booking.getId());

        return bookingMapper.toResponse(booking, savedTickets);
    }

    private String generateBookingCode() {
        return "BK-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase();
    }

    private String generateTicketCode() {
        return "TK-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase();
    }
}