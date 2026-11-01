package com.example.biblionova.seguridad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioCrearRequest(
        @NotBlank @Size(min = 3, max = 50) String nombreUsuario,
        @NotBlank @Size(max = 120) String nombreCompleto,
        @NotBlank @Email @Size(max = 150) String correo,
        @NotBlank @Size(min = 8, max = 72) String contrasena,
        @NotBlank String rol) {}