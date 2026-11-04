package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.EstadoPrestamo;
import java.time.LocalDateTime;
import java.util.List;

public record DevolucionResponse(Long devolucionId, String codigoDevolucion, Integer prestamoId,
                                 LocalDateTime fechaDevolucion, EstadoPrestamo estadoPrestamo,
                                 List<LineaDevolucionResponse> lineas) {}
