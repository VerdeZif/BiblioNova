package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.TipoEvidencia;
import java.time.LocalDateTime;

public record EvidenciaResponse(Long evidenciaId, Integer ejemplarId, Integer detallePrestamoId,
                                TipoEvidencia tipo, String descripcion, LocalDateTime fechaRegistro,
                                String registradoPor) {}
