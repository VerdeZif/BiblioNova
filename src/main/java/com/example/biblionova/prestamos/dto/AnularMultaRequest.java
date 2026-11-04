package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnularMultaRequest(@NotBlank @Size(max = 300) String motivo) {}
