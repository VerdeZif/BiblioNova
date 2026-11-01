package com.example.biblionova.seguridad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioActualizarRequest(
        @NotBlank @Size(max = 120) String nombreCompleto,
        @NotBlank @Email @Size(max = 150) String correo,
        @NotBlank String rol) {}