
package com.ticketbooking.service.booking;

import com.ticketbooking.entity.Event;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ConflictException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.EventSeatRepository;
import com.ticketbooking.enums.EventStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ticketbooking.entity.EventSeat;
import com.ticketbooking.enums.EventSeatStatus;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import java.time.LocalDateTime;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventSeatRepository eventSeatRepository;

    @Mock
    private RedisHoldService redisHoldService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Event event;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();

        event = new Event(
                null,
                "Test Event",
                "Event for testing",
                now.plusDays(1),
                now.plusDays(1).plusHours(2),
                now.minusHours(1),
                now.plusHours(1),
                null,
                EventStatus.OPEN
        );
    }

    @Test
    void shouldHoldSeatsSuccessfully() {
        // Arrange - Chuẩn bị dữ liệu và hành vi Mock

        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L, 11L);

        EventSeat seat1 = mock(EventSeat.class);
        EventSeat seat2 = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId,
                eventSeatIds
        )).thenReturn(List.of(seat1, seat2));

        when(seat1.getStatus())
                .thenReturn(EventSeatStatus.AVAILABLE);

        when(seat2.getStatus())
                .thenReturn(EventSeatStatus.AVAILABLE);

        when(redisHoldService.holdSeats(
                eventId,
                eventSeatIds,
                customerId
        )).thenReturn(true);

        // Act - Gọi phương thức cần kiểm thử

        assertDoesNotThrow(() ->
                bookingService.holdSeats(
                        eventId,
                        eventSeatIds,
                        customerId
                )
        );

        // Assert - Kiểm tra hành vi

        verify(eventRepository).findById(eventId);

        verify(eventSeatRepository).findByEventIdAndIdIn(
                eventId,
                eventSeatIds
        );

        verify(redisHoldService).holdSeats(
                eventId,
                eventSeatIds,
                customerId
        );
    }

    @Test
    void shouldRejectEmptySeatList() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of();

        // Act & Assert
        assertThrows(
                BadRequestException.class,
                () -> bookingService.holdSeats(
                        eventId,
                        eventSeatIds,
                        customerId
                )
        );

        // Không được truy vấn database hoặc Redis
        verifyNoInteractions(
                eventRepository,
                eventSeatRepository,
                redisHoldService
        );
    }

    @Test
    void shouldRejectDuplicateSeatIds() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;

        List<Long> eventSeatIds = List.of(10L, 10L);

        // Act & Assert
        assertThrows(
                BadRequestException.class,
                () -> bookingService.holdSeats(
                        eventId,
                        eventSeatIds,
                        customerId
                )
        );

        verifyNoInteractions(
                eventRepository,
                eventSeatRepository,
                redisHoldService
        );
    }

    @Test
    void shouldThrowWhenEventNotFound() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.holdSeats(
                        eventId,
                        eventSeatIds,
                        customerId
                )
        );

        // Không được kiểm tra ghế hoặc gọi Redis
        verify(eventRepository).findById(eventId);

        verifyNoInteractions(
                eventSeatRepository,
                redisHoldService
        );
    }


    @Test
    void shouldRejectEventThatIsNotOpen() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        event.setStatus(EventStatus.UPCOMING);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        // Act & Assert
        assertThrows(
                ConflictException.class,
                () -> bookingService.holdSeats(
                        eventId,
                        eventSeatIds,
                        customerId
                )
        );

        // Không được truy vấn ghế hoặc gọi Redis
        verify(eventRepository).findById(eventId);

        verifyNoInteractions(
                eventSeatRepository,
                redisHoldService
        );
    }
    @Test
    void shouldRejectEventWhenSaleHasNotStarted() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        event.setSaleStartTime(LocalDateTime.now().plusHours(1));

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        // Act & Assert
        assertThrows(
                ConflictException.class,
                () -> bookingService.holdSeats(eventId, eventSeatIds, customerId)
        );

        verify(eventRepository).findById(eventId);

        verifyNoInteractions(eventSeatRepository, redisHoldService);
    }
    @Test
    void shouldRejectEventWhenSaleHasEnded() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        event.setSaleEndTime(LocalDateTime.now().minusHours(1));

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        // Act & Assert
        assertThrows(
                ConflictException.class,
                () -> bookingService.holdSeats(eventId, eventSeatIds, customerId)
        );

        verify(eventRepository).findById(eventId);

        verifyNoInteractions(eventSeatRepository, redisHoldService);
    }
    @Test
    void shouldRejectSeatsNotBelongingToEvent() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L, 11L);

        EventSeat seat1 = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId,
                eventSeatIds
        )).thenReturn(List.of(seat1));

        // Act & Assert
        assertThrows(
                BadRequestException.class,
                () -> bookingService.holdSeats(eventId, eventSeatIds, customerId)
        );

        verify(eventSeatRepository).findByEventIdAndIdIn(eventId, eventSeatIds);

        verifyNoInteractions(redisHoldService);
    }
    @Test
    void shouldRejectBookedSeats() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        EventSeat seat = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId,
                eventSeatIds
        )).thenReturn(List.of(seat));

        when(seat.getStatus())
                .thenReturn(EventSeatStatus.BOOKED);

        // Act & Assert
        assertThrows(
                ConflictException.class,
                () -> bookingService.holdSeats(eventId, eventSeatIds, customerId)
        );

        verifyNoInteractions(redisHoldService);
    }
    @Test
    void shouldRejectWhenRedisHoldFails() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L);

        EventSeat seat = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId,
                eventSeatIds
        )).thenReturn(List.of(seat));

        when(seat.getStatus())
                .thenReturn(EventSeatStatus.AVAILABLE);

        when(redisHoldService.holdSeats(
                eventId,
                eventSeatIds,
                customerId
        )).thenReturn(false);

        // Act & Assert
        assertThrows(
                ConflictException.class,
                () -> bookingService.holdSeats(eventId, eventSeatIds, customerId)
        );

        verify(redisHoldService).holdSeats(eventId, eventSeatIds, customerId);
    }
    @Test
    void shouldReleaseSeatsSuccessfully() {
        // Arrange
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L, 11L);

        EventSeat seat1 = mock(EventSeat.class);
        EventSeat seat2 = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId, eventSeatIds
        )).thenReturn(List.of(seat1, seat2));

        when(redisHoldService.releaseSeats(
                eventId, eventSeatIds, customerId
        )).thenReturn(true);

        // Act & Assert
        assertDoesNotThrow(() ->
                bookingService.releaseSeats(eventId, eventSeatIds, customerId)
        );

        verify(eventRepository).findById(eventId);

        verify(eventSeatRepository).findByEventIdAndIdIn(
                eventId, eventSeatIds
        );

        verify(redisHoldService).releaseSeats(
                eventId, eventSeatIds, customerId
        );
    }
    @Test
    void shouldRejectEmptySeatListWhenReleasing() {
        assertThrows(
                BadRequestException.class,
                () -> bookingService.releaseSeats(1L, List.of(), 100L)
        );

        verifyNoInteractions(
                eventRepository,
                eventSeatRepository,
                redisHoldService
        );
    }
    @Test
    void shouldRejectDuplicateSeatIdsWhenReleasing() {
        List<Long> eventSeatIds = List.of(10L, 10L);

        assertThrows(
                BadRequestException.class,
                () -> bookingService.releaseSeats(1L, eventSeatIds, 100L)
        );

        verifyNoInteractions(
                eventRepository,
                eventSeatRepository,
                redisHoldService
        );
    }
    @Test
    void shouldThrowWhenEventNotFoundWhenReleasing() {
        Long eventId = 1L;
        List<Long> eventSeatIds = List.of(10L);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.releaseSeats(eventId, eventSeatIds, 100L)
        );

        verify(eventRepository).findById(eventId);

        verifyNoInteractions(
                eventSeatRepository,
                redisHoldService
        );
    }
    @Test
    void shouldRejectSeatsNotBelongingToEventWhenReleasing() {
        Long eventId = 1L;
        List<Long> eventSeatIds = List.of(10L, 11L);

        EventSeat seat1 = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId, eventSeatIds
        )).thenReturn(List.of(seat1));

        assertThrows(
                BadRequestException.class,
                () -> bookingService.releaseSeats(eventId, eventSeatIds, 100L)
        );

        verifyNoInteractions(redisHoldService);
    }
    @Test
    void shouldRejectWhenSeatsAreHeldByAnotherCustomer() {
        Long eventId = 1L;
        Long customerId = 100L;
        List<Long> eventSeatIds = List.of(10L, 11L);

        EventSeat seat1 = mock(EventSeat.class);
        EventSeat seat2 = mock(EventSeat.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        when(eventSeatRepository.findByEventIdAndIdIn(
                eventId, eventSeatIds
        )).thenReturn(List.of(seat1, seat2));

        when(redisHoldService.releaseSeats(
                eventId, eventSeatIds, customerId
        )).thenReturn(false);

        assertThrows(
                ConflictException.class,
                () -> bookingService.releaseSeats(eventId, eventSeatIds, customerId)
        );

        verify(redisHoldService).releaseSeats(
                eventId, eventSeatIds, customerId
        );
    }

}
