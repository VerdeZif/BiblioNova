package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.CondicionRecibida;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LineaDevolucionRequest(
        @NotBlank String codigoEjemplar,
        @NotNull CondicionRecibida condicionRecibida,
        @Size(max = 500) String observaciones) {}
