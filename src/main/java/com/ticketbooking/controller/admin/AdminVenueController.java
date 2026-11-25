
package com.ticketbooking.controller.admin;

import com.ticketbooking.dto.venue.CreateVenueRequest;
import com.ticketbooking.dto.venue.UpdateVenueRequest;
import com.ticketbooking.dto.venue.VenueResponse;
import com.ticketbooking.service.venue.VenueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/admin/venues")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVenueController {

    private final VenueService venueService;

    public AdminVenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    // POST /api/v1/admin/venues
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VenueResponse createVenue(
            @Valid @RequestBody CreateVenueRequest request
    ) {
        return venueService.createVenue(request);
    }

    // PUT /api/v1/admin/venues/{id}
    @PutMapping("/{id}")
    public VenueResponse updateVenue(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVenueRequest request
    ) {
        return venueService.updateVenue(id, request);
    }
}
