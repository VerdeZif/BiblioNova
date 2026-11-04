package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record EvaluarMultaRequest(
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal monto,
        @NotBlank @Size(max = 300) String justificacion) {}
