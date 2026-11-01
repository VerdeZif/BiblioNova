package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroClienteRequest(
        @NotBlank @Size(min = 3, max = 50) String nombreUsuario,
        @NotBlank @Size(min = 8, max = 72) String contrasena,
        @NotBlank @Email @Size(max = 150) String correo,
        @NotBlank @Size(max = 25) String documento,
        @NotBlank @Size(max = 80) String nombres,
        @NotBlank @Size(max = 100) String apellidos,
        @Size(max = 25) String telefono,
        @Size(max = 250) String direccion) {}
