
package com.ticketbooking.mapper;

import com.ticketbooking.dto.venue.CreateVenueRequest;
import com.ticketbooking.dto.venue.UpdateVenueRequest;
import com.ticketbooking.dto.venue.VenueResponse;
import com.ticketbooking.entity.Venue;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface VenueMapper {

    // Venue Entity -> VenueResponse
    VenueResponse toResponse(Venue venue);

//    // CreateVenueRequest -> Venue Entity
//    @BeanMapping(ignoreByDefault = true)
//    @Mapping(target = "venueName", source = "venueName")
//    @Mapping(target = "address", source = "address")
//    @Mapping(target = "description", source = "description")
//    @Mapping(target = "capacity", source = "capacity")
//    Venue toEntity(CreateVenueRequest request);

    // Update existing Venue Entity
    @BeanMapping(
            ignoreByDefault = true,
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "venueName", source = "venueName")
    @Mapping(target = "address", source = "address")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "capacity", source = "capacity")
    void updateEntity(
            UpdateVenueRequest request,
            @MappingTarget Venue venue
    );
}
