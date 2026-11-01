package com.example.biblionova.seguridad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarContrasenaRequest(
        @NotBlank String contrasenaActual,
        @NotBlank @Size(min = 8, max = 72) String contrasenaNueva) {}