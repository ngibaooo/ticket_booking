
package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.event.CreateEventRequest;
import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.dto.event.UpdateEventRequest;
import com.ticketbooking.dto.event.UpdateEventStatusRequest;
import com.ticketbooking.dto.eventSeat.EventSeatPricesResponse;
import com.ticketbooking.dto.eventSeat.UpdateEventSeatPricesRequest;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.service.event.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/events")
@Validated
public class AdminEventController {

    private final EventService eventService;

    public AdminEventController(EventService eventService) {
        this.eventService = eventService;
    }

    // Lấy danh sách tất cả sự kiện dành cho Admin
    @GetMapping
    public Page<EventResponse> getAdminEvents(

            @RequestParam(required = false)
            @Size(max = 100, message = "Keyword must not exceed 100 characters")
            String keyword,

            @RequestParam(required = false)
            EventStatus status,

            @RequestParam(required = false)
            @Positive(message = "Venue ID must be greater than 0")
            Long venueId,

            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Page must be greater than or equal to 0")
            int page,

            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Page size must be at least 1")
            @Max(value = 100, message = "Page size must not exceed 100")
            int size,

            @RequestParam(defaultValue = "startTime")
            @Pattern(
                    regexp = "^(startTime|createdAt|eventName)$",
                    message = "Sort field must be startTime, createdAt or eventName"
            )
            String sortBy,

            @RequestParam(defaultValue = "ASC")
            @Pattern(
                    regexp = "(?i)^(ASC|DESC)$",
                    message = "Sort direction must be ASC or DESC"
            )
            String direction
    ) {

        return eventService.getAdminEvents(
                keyword,
                status,
                venueId,
                page,
                size,
                sortBy,
                direction
        );
    }

    // Lấy chi tiết sự kiện theo ID dành cho Admin
    @GetMapping("/{id}")
    public EventResponse getAdminEventById(
            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long id
    ) {
        return eventService.getAdminEventById(id);
    }

    // Tạo sự kiện mới dành cho Admin
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody CreateEventRequest request
    ) {

        EventResponse response = eventService.createEvent(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    // Cập nhật thông tin sự kiện dành cho Admin
    @PatchMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long id,

            @Valid @RequestBody UpdateEventRequest request
    ) {

        EventResponse response = eventService.updateEvent(id, request);

        return ResponseEntity.ok(response);
    }

    // Cập nhật trạng thái sự kiện dành cho Admin
    @PatchMapping("/{id}/status")
    public ResponseEntity<EventResponse> updateEventStatus(

            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long id,

            @Valid @RequestBody UpdateEventStatusRequest request
    ) {

        EventResponse response = eventService.updateEventStatus(
                id,
                request
        );

        return ResponseEntity.ok(response);
    }

    // Cập nhật giá STANDARD và VIP cho các ghế chưa được đặt
    @PutMapping("/{eventId}/seats/prices")
    public ResponseEntity<Void> updateEventSeatPrices(

            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long eventId,

            @Valid @RequestBody UpdateEventSeatPricesRequest request

    ) {

        eventService.updateEventSeatPrices(
                eventId,
                request
        );

        return ResponseEntity.noContent().build();
    }

        @GetMapping("/{eventId}/seats/prices")
        public EventSeatPricesResponse getEventSeatPrices(
                        @PathVariable
                        @Positive(message = "Event ID must be greater than 0")
                        Long eventId
        ) {
                return eventService.getAdminEventSeatPrices(eventId);
        }

}
