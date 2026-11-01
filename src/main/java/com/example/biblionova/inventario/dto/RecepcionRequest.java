package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.TipoOrigen;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RecepcionRequest(
        @NotNull TipoOrigen tipoOrigen,
        Integer proveedorId,
        @Size(max = 180) String donante,
        @Size(max = 100) String documentoReferencia,
        @Size(max = 500) String observaciones,
        @NotEmpty @Size(max = 50) List<@Valid LineaRecepcionRequest> lineas) {}
