package com.example.biblionova.prestamos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record DevolucionRequest(
        @NotEmpty @Size(max = 10) List<@Valid LineaDevolucionRequest> lineas,
        @Size(max = 500) String observaciones) {}
