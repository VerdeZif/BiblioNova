package com.example.biblionova.auditoria.dto;

import java.time.LocalDateTime;

public record EventoResumen(Long eventoId, LocalDateTime fechaEvento, String usuario, String entidad,
                            String entidadId, String accion, String descripcion) {}