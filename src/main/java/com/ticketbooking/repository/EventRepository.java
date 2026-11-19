
package com.ticketbooking.repository;

import com.ticketbooking.entity.Event;
import com.ticketbooking.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    @Query("""
    SELECT e FROM Event e
    WHERE
        LOWER(e.eventName) LIKE LOWER(CONCAT('%', :keyword, '%'))
    AND (:venueId IS NULL OR e.venue.id = :venueId)
    AND (
        e.status NOT IN (
            com.ticketbooking.enums.EventStatus.DRAFT,
            com.ticketbooking.enums.EventStatus.CANCELLED
        )
    )
    AND (:status IS NULL OR e.status = :status)
    """)
    Page<Event> searchPublicEvents(
            @Param("keyword") String keyword,
            @Param("status") EventStatus status,
            @Param("venueId") Long venueId,
            Pageable pageable
    );
}
