
package com.ticketbooking.service.booking;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RedisHoldService {

    private static final long HOLD_DURATION_SECONDS = 300;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> holdSeatsScript;
    private final DefaultRedisScript<Long> releaseSeatsScript;

    public RedisHoldService(
            StringRedisTemplate redisTemplate,
            @Qualifier("holdSeatsScript") DefaultRedisScript<Long> holdSeatsScript,
            @Qualifier("releaseSeatsScript") DefaultRedisScript<Long> releaseSeatsScript
    ) {
        this.redisTemplate = redisTemplate;
        this.holdSeatsScript = holdSeatsScript;
        this.releaseSeatsScript = releaseSeatsScript;
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

    public boolean holdSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        List<String> keys = eventSeatIds.stream()
                .map(eventSeatId ->
                        "event:" + eventId + ":seat:" + eventSeatId + ":hold"
                )
                .toList();

        Long result = redisTemplate.execute(
                holdSeatsScript,
                keys,
                customerId.toString(),
                String.valueOf(HOLD_DURATION_SECONDS)
        );

        return Long.valueOf(1).equals(result);
    }

    public Set<Long> getHeldSeatIds(
            Long eventId,
            List<Long> eventSeatIds
    ) {
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            return Set.of();
        }

        // Tạo Redis keys tương ứng với từng EventSeat
        List<String> keys = eventSeatIds.stream()
                .map(eventSeatId ->
                        "event:" + eventId + ":seat:" + eventSeatId + ":hold"
                )
                .toList();

        // Lấy giá trị của tất cả keys trong một lần gọi Redis
        List<String> values = redisTemplate.opsForValue()
                .multiGet(keys);

        Set<Long> heldSeatIds = new HashSet<>();

        // Nếu key có giá trị thì ghế đang được giữ
        if (values != null) {
            for (int i = 0; i < values.size(); i++) {
                if (values.get(i) != null) {
                    heldSeatIds.add(eventSeatIds.get(i));
                }
            }
        }

        return heldSeatIds;
    }
    public boolean releaseSeats(
            Long eventId,
            List<Long> eventSeatIds,
            Long customerId
    ) {
        List<String> keys = eventSeatIds.stream()
                .map(eventSeatId ->
                        "event:" + eventId + ":seat:" + eventSeatId + ":hold"
                )
                .toList();

        Long result = redisTemplate.execute(
                releaseSeatsScript,
                keys,
                customerId.toString()
        );

        return Long.valueOf(1).equals(result);
    }
}
