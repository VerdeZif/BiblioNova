package com.example.biblionova.prestamos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LectorRequest(
        @NotBlank @Size(max = 25) String documento,
        @NotBlank @Size(max = 80) String nombres,
        @NotBlank @Size(max = 100) String apellidos,
        @Email @Size(max = 150) String correo,
        @Size(max = 25) String telefono,
        @Size(max = 250) String direccion) {}
