package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PrestamoRequest(
        @NotNull Integer lectorId,
        @NotEmpty @Size(max = 10) List<@NotBlank String> codigosEjemplar,
        @Size(max = 500) String observaciones) {}
