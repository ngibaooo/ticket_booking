
package com.ticketbooking.repository;

import com.ticketbooking.entity.Event;
import com.ticketbooking.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    // Lấy danh sách sự kiện theo trạng thái
    List<Event> findByStatus(EventStatus status);

    // Lấy danh sách sự kiện thuộc một địa điểm
    List<Event> findByVenueId(Long venueId);

    // Lấy danh sách sự kiện theo trạng thái và địa điểm
    List<Event> findByStatusAndVenueId(
            EventStatus status,
            Long venueId
    );
}
