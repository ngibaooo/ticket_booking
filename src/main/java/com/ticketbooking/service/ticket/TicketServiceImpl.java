package com.ticketbooking.service.ticket;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import com.ticketbooking.dto.ticket.TicketResponse;
import com.ticketbooking.entity.Ticket;
import com.ticketbooking.enums.TicketStatus;
import com.ticketbooking.exception.ConflictException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.mapper.TicketMapper;
import com.ticketbooking.repository.TicketRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final TicketMapper ticketMapper;

    public TicketServiceImpl(
            TicketRepository ticketRepository,
            TicketMapper ticketMapper
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketMapper = ticketMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getMyTicket(Long ticketId, Long customerId) {

        Ticket ticket = ticketRepository
                .findByIdAndBookingDetail_Booking_User_Id(
                        ticketId,
                        customerId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found")
                );

        return ticketMapper.toResponse(ticket);
    }
    @Override
    @Transactional(readOnly = true)
    public byte[] getMyTicketQr(Long ticketId, Long customerId) {

        Ticket ticket = ticketRepository
                .findByIdAndBookingDetail_Booking_User_Id(
                        ticketId,
                        customerId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found")
                );

        if (ticket.getStatus() != com.ticketbooking.enums.TicketStatus.VALID) {
            throw new ConflictException(
                    "QR code is only available for valid tickets"
            );
        }

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            var hints = Map.of(
                    EncodeHintType.CHARACTER_SET, "UTF-8",
                    EncodeHintType.MARGIN, 1
            );

            var bitMatrix = qrCodeWriter.encode(
                    ticket.getTicketCode(),
                    BarcodeFormat.QR_CODE,
                    300,
                    300,
                    hints
            );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {
            throw new IllegalStateException(
                    "Could not generate ticket QR code", e
            );
        }
    }
    @Override
    @Transactional
    public TicketResponse validateTicket(String ticketCode) {

        // 1. Tìm và khóa vé
        Ticket ticket = ticketRepository
                .findByTicketCodeForUpdate(ticketCode)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found")
                );

        // 2. Kiểm tra trạng thái vé
        if (ticket.getStatus() == TicketStatus.USED) {
            throw new ConflictException("Ticket has already been used");
        }

        if (ticket.getStatus() == TicketStatus.VOID) {
            throw new ConflictException("Ticket is invalid");
        }

        // 3. Xác nhận vé đã sử dụng
        ticket.setStatus(TicketStatus.USED);
        ticket.setUsedAt(LocalDateTime.now());

        // 4. Lưu thay đổi
        Ticket savedTicket = ticketRepository.save(ticket);

        return ticketMapper.toResponse(savedTicket);
    }
    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getMyTickets(
            Long customerId,
            Pageable pageable
    ) {
        return ticketRepository
                .findByBookingDetail_Booking_User_Id(customerId, pageable)
                .map(ticketMapper::toResponse);
    }
}