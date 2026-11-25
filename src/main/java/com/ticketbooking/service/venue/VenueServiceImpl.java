
package com.ticketbooking.service.venue;

import com.ticketbooking.dto.venue.CreateVenueRequest;
import com.ticketbooking.dto.venue.UpdateVenueRequest;
import com.ticketbooking.dto.venue.VenueDetailResponse;
import com.ticketbooking.dto.venue.VenueResponse;
import com.ticketbooking.entity.Venue;
import com.ticketbooking.enums.VenueStatus;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.VenueMapper;
import com.ticketbooking.repository.VenueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueMapper venueMapper;

    public VenueServiceImpl(
            VenueRepository venueRepository,
            VenueMapper venueMapper
    ) {
        this.venueRepository = venueRepository;
        this.venueMapper = venueMapper;
    }

    // GET: Public venue list
    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> getPublicVenues() {
        return venueRepository.findAllByStatus(VenueStatus.ACTIVE)
                .stream()
                .map(venueMapper::toResponse)
                .toList();
    }

        @Override
        @Transactional(readOnly = true)
        public List<VenueResponse> getAdminVenues() {
                return venueRepository.findAll()
                                .stream()
                                .map(venueMapper::toResponse)
                                .toList();
        }

    // GET: Venue detail
    @Override
    @Transactional(readOnly = true)
    public VenueDetailResponse getVenueDetail(Long venueId) {

        Venue venue = venueRepository.findById(venueId)
                .filter(v -> v.getStatus() == VenueStatus.ACTIVE)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Venue not found with id: " + venueId
                        )
                );

        return venueMapper.toDetailResponse(venue);
    }

    // POST: Create venue
    @Override
    @Transactional
    public VenueResponse createVenue(CreateVenueRequest request) {
        Venue venue = venueMapper.toEntity(request);

        venue.setStatus(VenueStatus.ACTIVE);

        Venue savedVenue = venueRepository.save(venue);

        return venueMapper.toResponse(savedVenue);
    }

    // PUT: Update venue
    @Override
    @Transactional
    public VenueResponse updateVenue(
            Long venueId,
            UpdateVenueRequest request
    ) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Venue not found with id: " + venueId
                        )
                );

        venueMapper.updateEntity(request, venue);

        Venue updatedVenue = venueRepository.save(venue);

        return venueMapper.toResponse(updatedVenue);
    }
}
