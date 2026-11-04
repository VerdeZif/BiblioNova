package com.example.biblionova.prestamos.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.prestamos.entity.EstadoPrestamo;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PrestamoResponse(Integer prestamoId, String codigoPrestamo, ItemRef lector, String politica,
                               LocalDateTime fechaPrestamo, LocalDate fechaVencimiento, EstadoPrestamo estado,
                               boolean vencido, int diasRetraso, String registradoPor, String observaciones,
                               List<DetallePrestamoResponse> ejemplares) {}
