package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;

import java.math.BigDecimal;

public record LineaVentaResponse(Long detalleVentaId, Integer ejemplarId, String codigoEjemplar,
                                 ItemRef libro, BigDecimal precioUnitario, BigDecimal importe) {}