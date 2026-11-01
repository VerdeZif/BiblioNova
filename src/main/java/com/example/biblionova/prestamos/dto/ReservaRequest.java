package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReservaRequest(
        Integer lectorId,
        @NotNull Integer libroId,
        @Size(max = 500) String observaciones) {}

