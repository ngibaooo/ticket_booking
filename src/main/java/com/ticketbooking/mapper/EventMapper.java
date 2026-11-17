
package com.ticketbooking.mapper;

import com.ticketbooking.dto.event.EventResponse;
import com.ticketbooking.dto.event.UpdateEventRequest;
import com.ticketbooking.entity.Event;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface EventMapper {

    @Mapping(target = "venueId", source = "venue.id")
    EventResponse toResponse(Event event);

    @BeanMapping(
            ignoreByDefault = true,
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "eventName", source = "eventName")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "startTime", source = "startTime")
    @Mapping(target = "endTime", source = "endTime")
    @Mapping(target = "saleStartTime", source = "saleStartTime")
    @Mapping(target = "saleEndTime", source = "saleEndTime")
    @Mapping(target = "bannerUrl", source = "bannerUrl")
    void updateEntity(
            UpdateEventRequest request,
            @MappingTarget Event event
    );
}
