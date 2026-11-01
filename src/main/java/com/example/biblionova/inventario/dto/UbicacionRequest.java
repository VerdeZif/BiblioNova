package com.example.biblionova.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UbicacionRequest(@NotBlank @Size(max = 40) String codigo,
                               @Size(max = 200) String descripcion, Boolean activa) {}
