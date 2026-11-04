package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnularPrestamoRequest(@NotBlank @Size(max = 500) String motivo) {}
