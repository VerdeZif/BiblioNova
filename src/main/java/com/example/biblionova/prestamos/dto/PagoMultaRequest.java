package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record PagoMultaRequest(
        @NotBlank String metodoCodigo,
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal monto,
        @Size(max = 100) String referenciaPago) {}
