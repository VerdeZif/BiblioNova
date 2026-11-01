package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.EstadoRegistroPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoVentaResponse(Long pagoVentaId, String metodoCodigo, String metodo, BigDecimal monto,
                                EstadoRegistroPago estado, String referenciaPago,
                                LocalDateTime fechaConfirmacion, String registradoPor) {}