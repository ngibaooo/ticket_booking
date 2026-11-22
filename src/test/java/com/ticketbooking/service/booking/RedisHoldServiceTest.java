
package com.ticketbooking.service.booking;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RedisHoldServiceTest {

    @Autowired
    private RedisHoldService redisHoldService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final Long EVENT_ID = 999001L;

    private String key(Long eventSeatId) {
        return "event:" + EVENT_ID + ":seat:" + eventSeatId + ":hold";
    }

    @AfterEach
    void cleanUp() {
        redisTemplate.delete(List.of(
                key(1L),
                key(2L),
                key(3L),
                key(4L)
        ));
    }

    @Test
    void testRedisConnection() {
        assertDoesNotThrow(redisHoldService::testConnection);
    }

    @Test
    void shouldHoldAvailableSeatSuccessfully() {
        boolean result = redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        assertTrue(result);
        assertEquals("100", redisTemplate.opsForValue().get(key(1L)));
    }

    @Test
    void shouldNotHoldSeatOwnedByAnotherCustomer() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(2L),
                100L
        );

        boolean result = redisHoldService.holdSeats(
                EVENT_ID,
                List.of(2L),
                200L
        );

        assertFalse(result);
        assertEquals("100", redisTemplate.opsForValue().get(key(2L)));
    }

    @Test
    void shouldAllowSameCustomerToHoldSeatAgain() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(3L),
                100L
        );

        // Giả lập ghế chỉ còn 30 giây trước khi hết hạn
        redisTemplate.expire(key(3L), Duration.ofSeconds(30));

        boolean result = redisHoldService.holdSeats(
                EVENT_ID,
                List.of(3L),
                100L
        );

        Long remainingTtl = redisTemplate.getExpire(
                key(3L),
                TimeUnit.SECONDS
        );

        assertTrue(result);
        assertEquals("100", redisTemplate.opsForValue().get(key(3L)));
        assertNotNull(remainingTtl);
        assertTrue(remainingTtl > 30);
    }

    @Test
    void shouldNotHoldAnySeatWhenOneSeatIsOwnedByAnotherCustomer() {
        // Khách hàng 200 đang giữ ghế số 4
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(4L),
                200L
        );

        // Khách hàng 100 muốn giữ cả ghế 1 và ghế 4
        boolean result = redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L, 4L),
                100L
        );

        assertFalse(result);

        // Ghế 1 không được giữ một phần
        assertNull(redisTemplate.opsForValue().get(key(1L)));

        // Ghế 4 vẫn thuộc khách hàng 200
        assertEquals("200", redisTemplate.opsForValue().get(key(4L)));
    }

//  Release Event Seats Test
    @Test
    void shouldReleaseSeatsOwnedByCustomerSuccessfully() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L, 2L),
                100L
        );

        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L, 2L),
                100L
        );

        assertTrue(result);
        assertNull(redisTemplate.opsForValue().get(key(1L)));
        assertNull(redisTemplate.opsForValue().get(key(2L)));
    }
    @Test
    void shouldReleaseOnlyRequestedSeats() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L, 2L, 3L),
                100L
        );

        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L, 2L),
                100L
        );

        assertTrue(result);

        assertNull(redisTemplate.opsForValue().get(key(1L)));
        assertNull(redisTemplate.opsForValue().get(key(2L)));
        assertEquals("100", redisTemplate.opsForValue().get(key(3L)));
    }
    @Test
    void shouldNotReleaseSeatOwnedByAnotherCustomer() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L),
                200L
        );

        assertFalse(result);
        assertEquals("100", redisTemplate.opsForValue().get(key(1L)));
    }
    @Test
    void shouldNotReleaseAnySeatWhenOneSeatIsOwnedByAnotherCustomer() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(2L),
                200L
        );

        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L, 2L),
                100L
        );

        assertFalse(result);

        // Ghế 1 vẫn thuộc khách hàng 100
        assertEquals("100", redisTemplate.opsForValue().get(key(1L)));

        // Ghế 2 vẫn thuộc khách hàng 200
        assertEquals("200", redisTemplate.opsForValue().get(key(2L)));
    }
    @Test
    void shouldReleaseExpiredSeatSuccessfully() {
        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        assertTrue(result);
        assertNull(redisTemplate.opsForValue().get(key(1L)));
    }
    @Test
    void shouldReleaseAlreadyReleasedSeatSuccessfully() {
        redisHoldService.holdSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        boolean result = redisHoldService.releaseSeats(
                EVENT_ID,
                List.of(1L),
                100L
        );

        assertTrue(result);
        assertNull(redisTemplate.opsForValue().get(key(1L)));
    }
}
