
package com.ticketbooking.service.seat;

import com.ticketbooking.dto.seat.CreateSeatRequest;
import com.ticketbooking.dto.seat.SeatResponse;
import com.ticketbooking.dto.seat.UpdateSeatRequest;
import com.ticketbooking.entity.Seat;
import com.ticketbooking.entity.Venue;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ConflictException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.SeatMapper;
import com.ticketbooking.repository.EventSeatRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.VenueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SeatServiceImpl implements SeatService {

    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;
    private final EventSeatRepository eventSeatRepository;
    private final SeatMapper seatMapper;

    public SeatServiceImpl(
            SeatRepository seatRepository,
            VenueRepository venueRepository,
            EventSeatRepository eventSeatRepository,
            SeatMapper seatMapper
    ) {
        this.seatRepository = seatRepository;
        this.venueRepository = venueRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.seatMapper = seatMapper;
    }

    // GET: Lấy sơ đồ ghế vật lý
    @Override
    @Transactional(readOnly = true)
    public List<SeatResponse> getVenueSeats(Long venueId) {

        if (!venueRepository.existsById(venueId)) {
            throw new ResourceNotFoundException(
                    "Venue not found with id: " + venueId
            );
        }

        return seatRepository
                .findByVenueIdOrderByPositionYAscPositionXAscSeatNumberAsc(
                        venueId
                )
                .stream()
                .map(seatMapper::toResponse)
                .toList();
    }

    // POST: Thêm ghế vật lý
    @Override
    @Transactional
    public SeatResponse createSeat(
            Long venueId,
            CreateSeatRequest request
    ) {

        // 1. Kiểm tra venue tồn tại
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Venue not found with id: " + venueId
                        )
                );

        // 2. Kiểm tra số ghế trùng
        if (seatRepository.existsByVenueIdAndSeatNumber(
                venueId,
                request.seatNumber()
        )) {
            throw new ConflictException(
                    "Seat number already exists in this venue"
            );
        }

        // 3. Kiểm tra tọa độ X, Y trùng
        if (seatRepository.existsByVenueIdAndPositionXAndPositionY(
                venueId,
                request.positionX(),
                request.positionY()
        )) {
            throw new ConflictException(
                    "Seat position already exists in this venue"
            );
        }

        // 4. Kiểm tra sức chứa venue
        long currentSeatCount = seatRepository.countByVenueId(venueId);

        if (currentSeatCount >= venue.getCapacity()) {
            throw new BadRequestException(
                    "Venue has reached its maximum capacity"
            );
        }

        // 5. Tạo ghế mới
        Seat seat = new Seat();
        seat.setVenue(venue);
        seat.setSeatNumber(request.seatNumber());
        seat.setRowName(request.rowName());
        seat.setSeatType(request.seatType());
        seat.setPositionX(request.positionX());
        seat.setPositionY(request.positionY());
        seat.setActive(true);

        // 6. Lưu database
        Seat savedSeat = seatRepository.save(seat);

        return seatMapper.toResponse(savedSeat);
    }


    // PUT: Cập nhật ghế vật lý
    @Override
    @Transactional
    public SeatResponse updateSeat(
            Long venueId,
            Long seatId,
            UpdateSeatRequest request
    ) {

        Seat seat = seatRepository.findByIdAndVenueId(seatId, venueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found in this venue"
                        )
                );

        // Kiểm tra số ghế mới có bị trùng không
        if (seatRepository.existsByVenueIdAndSeatNumberAndIdNot(
                venueId,
                request.seatNumber(),
                seatId
        )) {
            throw new ConflictException(
                    "Seat number already exists in this venue"
            );
        }

//      Kiểm tra trùng tọa độ
        if (seatRepository.existsByVenueIdAndPositionXAndPositionYAndIdNot(
                venueId,
                request.positionX(),
                request.positionY(),
                seatId
        )) {
            throw new ConflictException(
                    "Seat position already exists in this venue"
            );
        }

        seatMapper.updateEntity(request, seat);

        Seat updatedSeat = seatRepository.save(seat);

        return seatMapper.toResponse(updatedSeat);
    }

    // DELETE: Xóa ghế vật lý
    @Override
    @Transactional
    public void deleteSeat(Long venueId, Long seatId) {

        Seat seat = seatRepository.findByIdAndVenueId(seatId, venueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found in this venue"
                        )
                );

        // Không cho xóa ghế đã được liên kết với sự kiện
        if (eventSeatRepository.existsBySeatId(seatId)) {
            throw new ConflictException(
                    "Cannot delete seat because it has been used in an event"
            );
        }

        seatRepository.delete(seat);
    }
}
