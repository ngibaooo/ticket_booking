
package com.ticketbooking.service.venue;

import com.ticketbooking.dto.venue.CreateVenueRequest;
import com.ticketbooking.dto.venue.UpdateVenueRequest;
import com.ticketbooking.dto.venue.VenueDetailResponse;
import com.ticketbooking.dto.venue.VenueResponse;

import java.util.List;

public interface VenueService {

    List<VenueResponse> getPublicVenues();

    VenueDetailResponse getVenueDetail(Long venueId);

    VenueResponse createVenue(CreateVenueRequest request);

    VenueResponse updateVenue(Long venueId, UpdateVenueRequest request);
}
