
package com.ticketbooking.mapper;

import com.ticketbooking.dto.venue.CreateVenueRequest;
import com.ticketbooking.dto.venue.UpdateVenueRequest;
import com.ticketbooking.dto.venue.VenueDetailResponse;
import com.ticketbooking.dto.venue.VenueResponse;
import com.ticketbooking.entity.Venue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(
        componentModel = "spring",
        uses = {
                SeatMapper.class,
                EventMapper.class
        }
)
public interface VenueMapper {

    // Venue Entity -> VenueResponse
    VenueResponse toResponse(Venue venue);

    // Venue Entity -> VenueDetailResponse
    VenueDetailResponse toDetailResponse(Venue venue);

    // CreateVenueRequest -> Venue Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "seats", ignore = true)
    @Mapping(target = "events", ignore = true)
    Venue toEntity(CreateVenueRequest request);

    // Update existing Venue Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "seats", ignore = true)
    @Mapping(target = "events", ignore = true)
    void updateEntity(
            UpdateVenueRequest request,
            @MappingTarget Venue venue
    );
}
