package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.EstadoRegistroPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagoPedidoResponse(Long pagoPedidoId, String metodoCodigo, String metodo, BigDecimal monto,
                                 EstadoRegistroPago estado, String referenciaExterna,
                                 LocalDateTime fechaRegistro, LocalDateTime fechaConfirmacion,
                                 String confirmadoPor) {}