package com.example.biblionova.inventario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProveedorRequest(@NotBlank @Size(max = 180) String razonSocial,
                               @Size(max = 25) String documentoFiscal, @Size(max = 120) String contacto,
                               @Email @Size(max = 150) String correo, @Size(max = 25) String telefono,
                               @Size(max = 250) String direccion, Boolean activo) {}
