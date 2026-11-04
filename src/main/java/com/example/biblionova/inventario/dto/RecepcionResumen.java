package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.TipoOrigen;
import java.time.LocalDateTime;

public record RecepcionResumen(Long recepcionId, String codigoRecepcion, TipoOrigen tipoOrigen,
                               String origen, LocalDateTime fechaRecepcion, String registradoPor) {}
