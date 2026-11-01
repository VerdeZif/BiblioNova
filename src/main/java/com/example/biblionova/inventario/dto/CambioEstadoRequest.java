package com.example.biblionova.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoRequest(@NotNull AccionManual accion,
                                  @NotBlank @Size(max = 500) String motivo) {}
