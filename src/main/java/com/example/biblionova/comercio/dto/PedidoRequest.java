package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PedidoRequest(
        @NotNull TipoEntrega tipoEntrega,
        Long direccionId,
        @NotBlank String metodoPagoCodigo,
        @NotEmpty @Size(max = 30) List<@Valid LineaPedidoRequest> lineas,
        @Size(max = 500) String observaciones) {}