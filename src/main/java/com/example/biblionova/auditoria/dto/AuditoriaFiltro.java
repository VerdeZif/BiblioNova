package com.example.biblionova.auditoria.dto;

import java.time.LocalDate;

public record AuditoriaFiltro(String entidad, String entidadId, String accion, String usuario,
                              LocalDate desde, LocalDate hasta, String q) {}