
package com.ticketbooking.service.event;

import com.ticketbooking.dto.event.CreateEventRequest;
import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.dto.event.UpdateEventRequest;
import com.ticketbooking.dto.event.UpdateEventStatusRequest;
import com.ticketbooking.dto.eventSeat.EventSeatsResponse;
import com.ticketbooking.dto.eventSeat.UpdateEventSeatPricesRequest;
import com.ticketbooking.enums.EventStatus;
import org.springframework.data.domain.Page;

public interface EventService {

    Page<EventResponse> getPublicEvents(
            String keyword,
            EventStatus status,
            Long venueId,
            int page,
            int size,
            String sortBy,
            String direction
    );
    EventResponse getPublicEventById(Long eventId);
    // Lấy sơ đồ ghế của sự kiện công khai
    EventSeatsResponse getPublicEventSeats(Long eventId);

    Page<EventResponse> getAdminEvents(
            String keyword,
            EventStatus status,
            Long venueId,
            int page,
            int size,
            String sortBy,
            String direction
    );

    EventResponse getAdminEventById(Long eventId);

    // Admin tạo sự kiện mới
    EventResponse createEvent(CreateEventRequest request);
    // Admin cập nhật thông tin sự kiện
    EventResponse updateEvent(Long eventId, UpdateEventRequest request);

    // Admin cập nhật trạng thái sự kiện
    EventResponse updateEventStatus(
            Long eventId,
            UpdateEventStatusRequest request
    );
    // Admin cập nhật giá STANDARD và VIP cho các ghế chưa được đặt
    void updateEventSeatPrices(
            Long eventId,
            UpdateEventSeatPricesRequest request
    );

}
