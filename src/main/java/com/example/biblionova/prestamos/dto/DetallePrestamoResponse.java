package com.example.biblionova.prestamos.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.prestamos.entity.EstadoDetallePrestamo;
import java.time.LocalDateTime;

public record DetallePrestamoResponse(Integer detallePrestamoId, Integer ejemplarId, String codigoEjemplar,
                                      ItemRef libro, EstadoDetallePrestamo estado,
                                      LocalDateTime fechaDevolucion, String observacionDevolucion) {}
