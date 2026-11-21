
package com.ticketbooking.service.booking;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RedisHoldService {

    private final StringRedisTemplate redisTemplate;

    public RedisHoldService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void testConnection() {
        String key = "ticket-booking:redis:test";

        redisTemplate.opsForValue().set(
                key,
                "connected",
                Duration.ofMinutes(1)
        );

        String value = redisTemplate.opsForValue().get(key);

        if (!"connected".equals(value)) {
            throw new IllegalStateException("Redis connection test failed");
        }

        redisTemplate.delete(key);
    }
}
