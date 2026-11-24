
package com.ticketbooking.controller.venue;

import com.ticketbooking.dto.venue.VenueDetailResponse;
import com.ticketbooking.dto.venue.VenueResponse;
import com.ticketbooking.service.venue.VenueService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/venues")
public class VenueController {

    private final VenueService venueService;

    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    // GET /api/v1/venues
    @GetMapping
    public List<VenueResponse> getPublicVenues() {
        return venueService.getPublicVenues();
    }

    // GET /api/v1/venues/{id}
    @GetMapping("/{id}")
    public VenueDetailResponse getVenueDetail(@PathVariable Long id) {
        return venueService.getVenueDetail(id);
    }
}
