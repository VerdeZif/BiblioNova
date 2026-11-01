package com.example.biblionova.comercio.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record VentaPresencialRequest(
        Integer lectorId,                                            // opcional: cliente anónimo en mostrador
        @NotEmpty @Size(max = 30) List<@NotBlank String> codigosEjemplar,
        @NotBlank String metodoPagoCodigo,                           // EFECTIVO_TIENDA | TARJETA_TIENDA
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal montoRecibido,   // solo efectivo
        @Size(max = 100) String referenciaPago,                      // opcional: nº de operación del voucher
        @Size(max = 500) String observaciones) {}