
package com.ticketbooking.service.booking;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
class RedisHoldServiceTest {

    @Autowired
    private RedisHoldService redisHoldService;

    @Test
    void testRedisConnection() {
        assertDoesNotThrow(redisHoldService::testConnection);
    }
}
