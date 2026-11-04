package com.example.biblionova.comercio.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record LineaPedidoRequest(@NotNull Integer libroId, @NotNull @Min(1) @Max(20) Integer cantidad) {}
