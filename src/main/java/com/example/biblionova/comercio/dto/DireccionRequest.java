package com.example.biblionova.comercio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DireccionRequest(
        @NotBlank @Size(max = 150) String destinatario,
        @NotBlank @Size(max = 25) String telefono,
        @Size(max = 100) String departamento,
        @Size(max = 100) String provincia,
        @NotBlank @Size(max = 100) String distrito,
        @NotBlank @Size(max = 250) String direccion,
        @Size(max = 250) String referencia,
        Boolean predeterminada) {}