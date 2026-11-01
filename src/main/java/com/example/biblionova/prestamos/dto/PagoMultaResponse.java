package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.EstadoPagoMulta;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoMultaResponse(Long pagoMultaId, BigDecimal montoPagado, String metodo,
                                String referenciaPago, LocalDateTime fechaPago, EstadoPagoMulta estado,
                                String registradoPor) {}
