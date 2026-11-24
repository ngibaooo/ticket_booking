
package com.ticketbooking.repository;

import com.ticketbooking.entity.Venue;
import com.ticketbooking.enums.VenueStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VenueRepository extends JpaRepository<Venue, Long> {
    List<Venue> findAllByStatus(VenueStatus status);
}
