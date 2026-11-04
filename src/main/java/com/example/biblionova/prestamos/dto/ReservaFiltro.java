package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.EstadoReserva;

public record ReservaFiltro(Integer lectorId, Integer libroId, EstadoReserva estado) {}
