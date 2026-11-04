package com.example.biblionova.catalogo.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record LibroRequest(
        @Size(max = 20) String isbn,
        @NotBlank @Size(max = 250) String titulo,
        Integer categoriaId,
        Integer editorialId,
        @Min(1000) @Max(9999) Short anioPublicacion,
        @Size(max = 50) String edicion,
        String descripcion,
        @Size(max = 500) String imagenPortada,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal precioVenta,
        Boolean prestamoHabilitado,
        Boolean ventaHabilitada,
        @NotEmpty List<Integer> autorIds) {}
