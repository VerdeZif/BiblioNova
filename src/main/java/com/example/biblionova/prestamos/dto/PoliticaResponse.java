package com.example.biblionova.prestamos.dto;

import java.math.BigDecimal;

public record PoliticaResponse(Integer politicaId, String nombre, int diasPrestamo, int maxEjemplares,
                               BigDecimal tarifaRetrasoDiaria, BigDecimal maxMultaRetraso, boolean activa) {}
