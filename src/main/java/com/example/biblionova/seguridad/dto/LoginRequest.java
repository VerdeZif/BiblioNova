package com.example.biblionova.seguridad.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String usuario,
        @NotBlank String contrasena) {}
