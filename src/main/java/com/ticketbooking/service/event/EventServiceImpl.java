
package com.ticketbooking.service.event;

import com.ticketbooking.dto.event.CreateEventRequest;
import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.dto.event.UpdateEventRequest;
import com.ticketbooking.dto.event.UpdateEventStatusRequest;
import com.ticketbooking.dto.eventSeat.EventSeatResponse;
import com.ticketbooking.dto.eventSeat.EventSeatsResponse;
import com.ticketbooking.dto.eventSeat.UpdateEventSeatPricesRequest;
import com.ticketbooking.entity.Event;
import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.entity.Seat;
import com.ticketbooking.entity.Venue;
import com.ticketbooking.enums.EventSeatStatus;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.enums.SeatType;
import com.ticketbooking.enums.VenueStatus;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.EventMapper;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.EventSeatRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.VenueRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final VenueRepository venueRepository;
    private final SeatRepository seatRepository;
    private final EventSeatRepository eventSeatRepository;

    public EventServiceImpl(
            EventRepository eventRepository,
            EventMapper eventMapper,
            VenueRepository venueRepository,
            SeatRepository seatRepository,
            EventSeatRepository eventSeatRepository
    ) {
        this.eventRepository = eventRepository;
        this.eventMapper = eventMapper;
        this.venueRepository = venueRepository;
        this.seatRepository = seatRepository;
        this.eventSeatRepository = eventSeatRepository;
    }
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "startTime",
            "createdAt",
            "eventName"
    );

    private String normalizeKeyword(String keyword) {

        if (keyword == null || keyword.isBlank()) {
            return "";
        }

        return keyword.trim();
    }

    private Pageable createPageable(
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        // Kiểm tra page
        if (page < 0) {
            throw new BadRequestException(
                    "Page must be greater than or equal to 0"
            );
        }

        // Kiểm tra size
        if (size < 1 || size > 100) {
            throw new BadRequestException(
                    "Page size must be between 1 and 100"
            );
        }

        // Kiểm tra sortBy
        if (sortBy == null
                || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException(
                    "Invalid sort field. Allowed fields: startTime, createdAt, eventName"
            );
        }

        // Kiểm tra direction
        if (direction == null || direction.isBlank()) {
            throw new BadRequestException(
                    "Sort direction is required"
            );
        }

        Sort.Direction sortDirection;

        try {
            sortDirection = Sort.Direction.fromString(
                    direction.trim()
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "Sort direction must be ASC or DESC"
            );
        }

        Sort sort = Sort.by(sortDirection, sortBy);

        return PageRequest.of(page, size, sort);
    }
    // Kiểm tra thời gian sự kiện
    private void validateEventTimes(
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime saleStartTime,
            LocalDateTime saleEndTime
    ) {

        // End time phải sau Start time
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException(
                    "End time must be after start time"
            );
        }

        // Sale end time phải sau Sale start time
        if (!saleEndTime.isAfter(saleStartTime)) {
            throw new BadRequestException(
                    "Sale end time must be after sale start time"
            );
        }

        // Sale end time không được sau Start time
        if (saleEndTime.isAfter(startTime)) {
            throw new BadRequestException(
                    "Sale end time must be before or equal to event start time"
            );
        }
    }

    // Lấy giá theo loại ghế
    private BigDecimal getPriceBySeatType(
            SeatType seatType,
            CreateEventRequest request
    ) {

        return switch (seatType) {
            case STANDARD -> request.seatPrices().standardPrice();
            case VIP -> request.seatPrices().vipPrice();
        };
    }

    @Override
    public Page<EventResponse> getPublicEvents(
            String keyword,
            EventStatus status,
            Long venueId,
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        // 1. Kiểm tra và chuẩn hóa keyword
        keyword = normalizeKeyword(keyword);

        // 2. Kiểm tra venueId
        if (venueId != null && venueId <= 0) {
            throw new BadRequestException(
                    "Venue ID must be greater than 0"
            );
        }

        // 3. Tạo Pageable
        Pageable pageable = createPageable(
                page,
                size,
                sortBy,
                direction
        );

        // 4. Tìm kiếm sự kiện công khai
        Page<Event> events = eventRepository.searchPublicEvents(
                keyword,
                status,
                venueId,
                pageable
        );

        // 5. Chuyển Event thành EventResponse
        return events.map(eventMapper::toResponse);
    }

    @Override
    public EventResponse getPublicEventById(Long eventId) {

        // 1. Kiểm tra eventId
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm sự kiện, loại trừ DRAFT và CANCELLED
        Event event = eventRepository.findByIdAndStatusNotIn(
                eventId,
                List.of(EventStatus.DRAFT, EventStatus.CANCELLED)
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Event not found with ID: " + eventId
        ));

        // 3. Chuyển Event thành EventResponse
        return eventMapper.toResponse(event);
    }
    @Override
    public EventSeatsResponse getPublicEventSeats(Long eventId) {

        // 1. Kiểm tra Event ID
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm sự kiện công khai, loại trừ DRAFT và CANCELLED
        Event event = eventRepository.findByIdAndStatusNotIn(
                eventId,
                List.of(EventStatus.DRAFT, EventStatus.CANCELLED)
        ).orElseThrow(() -> new ResourceNotFoundException(
                "Event not found with ID: " + eventId
        ));

        // 3. Lấy danh sách ghế của sự kiện kèm thông tin Seat
        List<EventSeat> eventSeats =
                eventSeatRepository.findByEventIdWithSeat(eventId);

        // 4. Chuyển EventSeat thành EventSeatResponse
        List<EventSeatResponse> seatResponses = eventSeats.stream()
                .map(eventSeat -> {

                    Seat seat = eventSeat.getSeat();

                    return new EventSeatResponse(
                            eventSeat.getId(),
                            seat.getId(),
                            seat.getSeatNumber(),
                            seat.getRowName(),
                            seat.getSeatType(),
                            seat.getPositionX(),
                            seat.getPositionY(),
                            eventSeat.getPrice(),
                            eventSeat.getStatus(),
                            seat.getActive(),
                            false
                    );
                })
                .toList();

        // 5. Trả về sơ đồ ghế của sự kiện
        return new EventSeatsResponse(
                event.getId(),
                event.getEventName(),
                seatResponses
        );
    }

    @Override
    public Page<EventResponse> getAdminEvents(
            String keyword,
            EventStatus status,
            Long venueId,
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        // 1. Kiểm tra và chuẩn hóa keyword
        keyword = normalizeKeyword(keyword);

        // 2. Kiểm tra venueId
        if (venueId != null && venueId <= 0) {
            throw new BadRequestException(
                    "Venue ID must be greater than 0"
            );
        }

        // 3. Tạo Pageable
        Pageable pageable = createPageable(
                page,
                size,
                sortBy,
                direction
        );

        // 4. Tìm kiếm tất cả sự kiện dành cho Admin
        Page<Event> events = eventRepository.searchAdminEvents(
                keyword,
                status,
                venueId,
                pageable
        );

        // 5. Chuyển Event thành EventResponse
        return events.map(eventMapper::toResponse);
    }

    @Override
    public EventResponse getAdminEventById(Long eventId) {

        // 1. Kiểm tra eventId
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm sự kiện theo ID, không lọc status
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with ID: " + eventId
                ));

        // 3. Chuyển Event thành EventResponse
        return eventMapper.toResponse(event);
    }

    @Override
    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {

        // 1. Kiểm tra thời gian sự kiện
        validateEventTimes(
                request.startTime(),
                request.endTime(),
                request.saleStartTime(),
                request.saleEndTime()
        );

        // 2. Tìm Venue
        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Venue not found with ID: " + request.venueId()
                ));

        // 3. Kiểm tra Venue có đang hoạt động không
        if (venue.getStatus() != VenueStatus.ACTIVE) {
            throw new BadRequestException(
                    "Cannot create event for an inactive venue"
            );
        }

        // 4. Lấy danh sách ghế đang hoạt động của Venue
        List<Seat> seats = seatRepository
                .findByVenueIdAndIsActiveTrue(venue.getId());

        if (seats.isEmpty()) {
            throw new BadRequestException(
                    "Cannot create event because this venue has no active seats"
            );
        }

        // 5. Tạo Event
        Event event = new Event(
                venue,
                request.eventName().trim(),
                request.description(),
                request.startTime(),
                request.endTime(),
                request.saleStartTime(),
                request.saleEndTime(),
                request.bannerUrl(),
                EventStatus.DRAFT
        );

        // 6. Lưu Event để lấy ID
        Event savedEvent = eventRepository.save(event);

        // 7. Tạo EventSeat cho từng Seat
        List<EventSeat> eventSeats = new ArrayList<>();

        for (Seat seat : seats) {

            BigDecimal price = getPriceBySeatType(
                    seat.getSeatType(),
                    request
            );

            EventSeat eventSeat = new EventSeat(
                    savedEvent,
                    seat,
                    price,
                    EventSeatStatus.AVAILABLE
            );

            eventSeats.add(eventSeat);
        }

        // 8. Lưu toàn bộ EventSeat
        eventSeatRepository.saveAll(eventSeats);

        // 9. Chuyển Event thành EventResponse
        return eventMapper.toResponse(savedEvent);
    }

    @Override
    @Transactional
    public EventResponse updateEvent(
            Long eventId,
            UpdateEventRequest request
    ) {

        // 1. Kiểm tra Event ID
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm Event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with ID: " + eventId
                ));

        // 3. Kiểm tra trạng thái Event
        if (event.getStatus() != EventStatus.DRAFT
                && event.getStatus() != EventStatus.UPCOMING) {

            throw new BadRequestException(
                    "Cannot update an event that is not in DRAFT or UPCOMING status"
            );
        }

        // 4. Kết hợp dữ liệu mới và dữ liệu hiện tại
        LocalDateTime startTime = request.startTime() != null
                ? request.startTime()
                : event.getStartTime();

        LocalDateTime endTime = request.endTime() != null
                ? request.endTime()
                : event.getEndTime();

        LocalDateTime saleStartTime = request.saleStartTime() != null
                ? request.saleStartTime()
                : event.getSaleStartTime();

        LocalDateTime saleEndTime = request.saleEndTime() != null
                ? request.saleEndTime()
                : event.getSaleEndTime();

        // 5. Kiểm tra tính hợp lệ của thời gian sau cập nhật
        validateEventTimes(
                startTime,
                endTime,
                saleStartTime,
                saleEndTime
        );

        // 6. Cập nhật những trường được truyền lên

        if (request.eventName() != null) {

            if (request.eventName().isBlank()) {
                throw new BadRequestException(
                        "Event name must not be blank"
                );
            }

            event.setEventName(request.eventName().trim());
        }

        if (request.description() != null) {
            event.setDescription(request.description());
        }

        if (request.startTime() != null) {
            event.setStartTime(startTime);
        }

        if (request.endTime() != null) {
            event.setEndTime(endTime);
        }

        if (request.saleStartTime() != null) {
            event.setSaleStartTime(saleStartTime);
        }

        if (request.saleEndTime() != null) {
            event.setSaleEndTime(saleEndTime);
        }

        if (request.bannerUrl() != null) {
            event.setBannerUrl(request.bannerUrl());
        }

        // 7. Chuyển Event thành EventResponse
        return eventMapper.toResponse(event);
    }

    // Kiểm tra quy tắc chuyển trạng thái sự kiện
    private void validateEventStatusTransition(
            Event event,
            EventStatus newStatus
    ) {

        EventStatus currentStatus = event.getStatus();

        // Không cho phép chuyển sang trạng thái giống hiện tại
        if (currentStatus == newStatus) {
            throw new BadRequestException(
                    "Event is already in " + currentStatus + " status"
            );
        }

        // Kiểm tra quy tắc chuyển trạng thái
        boolean isValidTransition = switch (currentStatus) {
            case DRAFT -> newStatus == EventStatus.UPCOMING;

            case UPCOMING -> newStatus == EventStatus.OPEN;

            case OPEN -> newStatus == EventStatus.CLOSED;

            case CLOSED -> newStatus == EventStatus.COMPLETED;

            case COMPLETED, CANCELLED -> false;
        };

        if (!isValidTransition) {
            throw new BadRequestException(
                    "Cannot change event status from "
                            + currentStatus + " to " + newStatus
            );
        }

        // Kiểm tra thời gian khi mở bán vé
        if (newStatus == EventStatus.OPEN) {

            LocalDateTime now = LocalDateTime.now();

            if (now.isBefore(event.getSaleStartTime())) {
                throw new BadRequestException(
                        "Cannot open ticket sales before sale start time"
                );
            }

            if (!now.isBefore(event.getSaleEndTime())) {
                throw new BadRequestException(
                        "Cannot open ticket sales after sale end time"
                );
            }
        }

        // Kiểm tra thời gian khi hoàn thành sự kiện
        if (newStatus == EventStatus.COMPLETED) {

            if (LocalDateTime.now().isBefore(event.getEndTime())) {
                throw new BadRequestException(
                        "Cannot complete an event before its end time"
                );
            }
        }
    }
    @Override
    @Transactional
    public EventResponse updateEventStatus(
            Long eventId,
            UpdateEventStatusRequest request
    ) {

        // 1. Kiểm tra Event ID
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm Event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with ID: " + eventId
                ));

        // 3. Kiểm tra quy tắc chuyển trạng thái
        validateEventStatusTransition(
                event,
                request.status()
        );

        // 4. Cập nhật trạng thái
        event.setStatus(request.status());

        // 5. Chuyển Event thành EventResponse
        return eventMapper.toResponse(event);
    }


    @Override
    @Transactional
    public void updateEventSeatPrices(
            Long eventId,
            UpdateEventSeatPricesRequest request
    ) {

        // 1. Kiểm tra Event ID
        if (eventId == null || eventId <= 0) {
            throw new BadRequestException(
                    "Event ID must be greater than 0"
            );
        }

        // 2. Tìm Event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with ID: " + eventId
                ));

        // 3. Chỉ cho phép cập nhật giá khi Event ở DRAFT hoặc UPCOMING
        if (event.getStatus() != EventStatus.DRAFT
                && event.getStatus() != EventStatus.UPCOMING) {

            throw new BadRequestException(
                    "Cannot update seat prices when event is not in DRAFT or UPCOMING status"
            );
        }

        // 4. Lấy danh sách ghế chưa được đặt
        List<EventSeat> eventSeats =
                eventSeatRepository.findByEventIdAndStatusWithSeat(
                        eventId,
                        EventSeatStatus.AVAILABLE
                );

        // 5. Cập nhật giá theo loại ghế
        for (EventSeat eventSeat : eventSeats) {

            Seat seat = eventSeat.getSeat();

            BigDecimal newPrice = switch (seat.getSeatType()) {
                case STANDARD -> request.standardPrice();
                case VIP -> request.vipPrice();
            };

            eventSeat.setPrice(newPrice);
        }
    }

}
