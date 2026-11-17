
package com.ticketbooking.mapper;

import com.ticketbooking.dto.user.UpdateUserRequest;
import com.ticketbooking.dto.user.UserResponse;
import com.ticketbooking.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface UserMapper {

    // User Entity -> UserResponse
    UserResponse toResponse(User user);

    // Update existing User Entity
    @BeanMapping(
            ignoreByDefault = true,
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "phone", source = "phone")
    void updateEntity(
            UpdateUserRequest request,
            @MappingTarget User user
    );
}
