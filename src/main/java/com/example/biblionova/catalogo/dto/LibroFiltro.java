package com.example.biblionova.catalogo.dto;

import java.math.BigDecimal;

public record LibroFiltro(String q, Integer categoriaId, Integer editorialId, Integer autorId,
                          BigDecimal precioMin, BigDecimal precioMax,
                          Boolean ventaHabilitada, Boolean prestamoHabilitado) {}
