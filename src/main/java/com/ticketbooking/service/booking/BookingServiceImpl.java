
package com.ticketbooking.service.booking;

import com.ticketbooking.dto.booking.BookingResponse;
import com.ticketbooking.entity.Booking;
import com.ticketbooking.entity.Event;
import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.enums.EventSeatStatus;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ConflictException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.BookingMapper;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.EventSeatRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final RedisHoldService redisHoldService;
    private final BookingPersistenceService bookingPersistenceService;
    private final BookingMapper bookingMapper;

    public BookingServiceImpl(
            EventRepository eventRepository,
            EventSeatRepository eventSeatRepository,
            RedisHoldService redisHoldService,
            BookingPersistenceService bookingPersistenceService,
            BookingMapper bookingMapper
    ) {
        this.eventRepository = eventRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.redisHoldService = redisHoldService;
        this.bookingPersistenceService = bookingPersistenceService;
        this.bookingMapper = bookingMapper;
    }

    @Override
    public void holdSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        // Bước 1: Kiểm tra danh sách ghế
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            throw new BadRequestException("Seat list must not be empty");
        }

        if (new HashSet<>(eventSeatIds).size() != eventSeatIds.size()) {
            throw new BadRequestException("Duplicate seat IDs are not allowed");
        }

        // Bước 2: Tìm sự kiện
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Event not found")
                );

        // Bước 3: Kiểm tra trạng thái và thời gian mở bán
        LocalDateTime now = LocalDateTime.now();

        boolean saleNotStarted = now.isBefore(event.getSaleStartTime());
        boolean saleEnded = now.isAfter(event.getSaleEndTime());

        if (event.getStatus() != EventStatus.OPEN
                || saleNotStarted
                || saleEnded) {
            throw new ConflictException(
                    "Event is not available for seat holding"
            );
        }

        // Bước 4: Lấy các ghế thuộc sự kiện
        List<EventSeat> eventSeats =
                eventSeatRepository.findByEventIdAndIdIn(
                        eventId,
                        eventSeatIds
                );

        if (eventSeats.size() != eventSeatIds.size()) {
            throw new BadRequestException(
                    "One or more seats do not belong to this event"
            );
        }

        // Bước 5: Kiểm tra trạng thái ghế trong PostgreSQL
        boolean hasUnavailableSeat = eventSeats.stream()
                .anyMatch(eventSeat ->
                        eventSeat.getStatus() != EventSeatStatus.AVAILABLE
                );

        if (hasUnavailableSeat) {
            throw new ConflictException(
                    "One or more seats are already booked"
            );
        }

        // Bước 6: Giữ toàn bộ ghế trong Redis
        boolean held = redisHoldService.holdSeats(
                eventId,
                eventSeatIds,
                customerId
        );

        if (!held) {
            throw new ConflictException(
                    "One or more seats are already held by another customer"
            );
        }
    }
    @Override
    public void releaseSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        // Bước 1: Kiểm tra danh sách ghế
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            throw new BadRequestException("Seat list must not be empty");
        }

        if (new HashSet<>(eventSeatIds).size() != eventSeatIds.size()) {
            throw new BadRequestException("Duplicate seat IDs are not allowed");
        }

        // Bước 2: Kiểm tra event tồn tại
        eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Event not found"));

        // Bước 3: Kiểm tra các ghế thuộc event
        List<EventSeat> eventSeats =
                eventSeatRepository.findByEventIdAndIdIn(eventId, eventSeatIds);

        if (eventSeats.size() != eventSeatIds.size()) {
            throw new BadRequestException(
                    "One or more seats do not belong to this event");
        }

        // Bước 4: Giải phóng ghế trong Redis
        boolean released = redisHoldService.releaseSeats(
                eventId,
                eventSeatIds,
                customerId
        );

        if (!released) {
            throw new ConflictException(
                    "One or more seats are held by another customer");
        }
    }
    @Override
    public BookingResponse confirmBooking(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        // Bước 1: Kiểm tra danh sách ghế
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            throw new BadRequestException("Seat list must not be empty");
        }

        if (new HashSet<>(eventSeatIds).size() != eventSeatIds.size()) {
            throw new BadRequestException("Duplicate seat IDs are not allowed");
        }

        // Bước 2: Kiểm tra Event tồn tại
        eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Event not found")
                );

        // Bước 3: Kiểm tra khách hàng có đang giữ tất cả ghế trong Redis không
        boolean allSeatsHeld = redisHoldService.verifySeatsHeldByCustomer(
                eventId,
                eventSeatIds,
                customerId
        );

        if (!allSeatsHeld) {
            throw new ConflictException(
                    "One or more seats are not held by this customer or hold has expired"
            );
        }

        // Bước 4: Xác nhận booking và lưu vào PostgreSQL
        BookingResponse response = bookingPersistenceService.confirmBooking(
                eventId,
                eventSeatIds,
                customerId
        );

        // Bước 5: Giải phóng Redis sau khi PostgreSQL commit
        boolean released = redisHoldService.releaseSeats(
                eventId,
                eventSeatIds,
                customerId
        );

        if (!released) {
            // Booking đã được xác nhận trong PostgreSQL.
            // Redis key sẽ tự hết hạn sau TTL.
        }

        return response;
    }
}
