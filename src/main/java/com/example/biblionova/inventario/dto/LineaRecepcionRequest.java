package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.CondicionFisica;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record LineaRecepcionRequest(
        @NotNull Integer libroId,
        @NotNull @Min(1) @Max(500) Integer cantidad,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal costoUnitario,
        Integer ubicacionId,
        Boolean esVendible,
        Boolean esPrestamo,
        CondicionFisica condicionFisica,
        @Size(max = 500) String observaciones) {}
