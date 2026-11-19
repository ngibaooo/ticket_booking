
package com.ticketbooking.controller.event;

import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.enums.EventStatus;
import com.ticketbooking.service.event.EventService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@Validated
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public Page<EventResponse> getPublicEvents(

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

        return eventService.getPublicEvents(
                keyword,
                status,
                venueId,
                page,
                size,
                sortBy,
                direction
        );
    }
    // Lấy chi tiết sự kiện công khai theo ID
    @GetMapping("/{id}")
    public EventResponse getPublicEventById(
            @PathVariable
            @Positive(message = "Event ID must be greater than 0")
            Long id
    ) {
        return eventService.getPublicEventById(id);
    }
}
