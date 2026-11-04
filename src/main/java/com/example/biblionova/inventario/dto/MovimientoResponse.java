package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import java.time.LocalDateTime;

public record MovimientoResponse(Long movimientoId, TipoMovimiento tipoMovimiento,
                                 EstadoEjemplar estadoAnterior, EstadoEjemplar estadoNuevo,
                                 String referenciaTipo, Long referenciaId, String motivo,
                                 LocalDateTime fechaMovimiento, String usuario) {}
