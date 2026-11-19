
package com.ticketbooking.service.event;

import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.entity.Event;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.EventMapper;
import com.ticketbooking.repository.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "startTime",
            "createdAt",
            "eventName"
    );

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    public EventServiceImpl(
            EventRepository eventRepository,
            EventMapper eventMapper
    ) {
        this.eventRepository = eventRepository;
        this.eventMapper = eventMapper;
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
}
