
package com.ticketbooking.security;

import com.ticketbooking.entity.User;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.repository.UserRepository;
import com.ticketbooking.enums.UserStatus;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getStatus() == UserStatus.ACTIVE,
                AuthorityUtils.createAuthorityList(
                        "ROLE_" + user.getRole().name()
                )
        );
    }
}
