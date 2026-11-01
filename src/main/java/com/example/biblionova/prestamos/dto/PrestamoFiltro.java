package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.EstadoPrestamo;

public record PrestamoFiltro(Integer lectorId, EstadoPrestamo estado, Boolean soloVencidos, String q) {}
