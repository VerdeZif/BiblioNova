package com.example.biblionova.auditoria.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record EventoDetalle(Long eventoId, LocalDateTime fechaEvento, String usuario, String entidad,
                            String entidadId, String accion, String descripcion,
                            Map<String, Object> datosAntes, Map<String, Object> datosDespues,
                            String direccionIp) {}