package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record PoliticaRequest(
        @NotBlank @Size(max = 80) String nombre,
        @NotNull @Min(1) @Max(90) Integer diasPrestamo,
        @NotNull @Min(1) @Max(20) Integer maxEjemplares,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal tarifaRetrasoDiaria,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal maxMultaRetraso) {}
