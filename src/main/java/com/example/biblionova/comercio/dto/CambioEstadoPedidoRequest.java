package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.EstadoPedido;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoPedidoRequest(
        @NotNull EstadoPedido estado,
        @Size(max = 100) String operador,
        @Size(max = 100) String codigoSeguimiento,
        @Size(max = 150) String recibidoPor,
        @Size(max = 500) String observaciones) {}