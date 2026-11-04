package com.example.biblionova.inventario.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.inventario.entity.TipoOrigen;
import java.time.LocalDateTime;
import java.util.List;

public record RecepcionResponse(Long recepcionId, String codigoRecepcion, TipoOrigen tipoOrigen,
                                ItemRef proveedor, String donante, String documentoReferencia,
                                LocalDateTime fechaRecepcion, String registradoPor, String observaciones,
                                List<LineaRecepcionResponse> lineas) {}
