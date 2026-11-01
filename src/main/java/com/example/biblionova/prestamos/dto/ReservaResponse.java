package com.example.biblionova.prestamos.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.prestamos.entity.EstadoReserva;
import java.time.LocalDateTime;

public record ReservaResponse(Long reservaId, ItemRef lector, ItemRef libro, EstadoReserva estado,
                              LocalDateTime fechaSolicitud, LocalDateTime fechaExpiracion,
                              String codigoEjemplar, String observaciones) {}
