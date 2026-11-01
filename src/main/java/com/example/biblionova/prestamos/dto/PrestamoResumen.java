package com.example.biblionova.prestamos.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.prestamos.entity.EstadoPrestamo;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PrestamoResumen(Integer prestamoId, String codigoPrestamo, ItemRef lector,
                              LocalDateTime fechaPrestamo, LocalDate fechaVencimiento,
                              EstadoPrestamo estado, boolean vencido) {}
