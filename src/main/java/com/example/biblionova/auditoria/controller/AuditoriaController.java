package com.example.biblionova.auditoria.controller;

import com.example.biblionova.auditoria.dto.AuditoriaFiltro;
import com.example.biblionova.auditoria.dto.EventoDetalle;
import com.example.biblionova.auditoria.dto.EventoResumen;
import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.common.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AuditoriaController {
    private final AuditoriaService service;

    // Ej: ?entidad=Libro&accion=CAMBIAR_PRECIO&desde=2026-10-31&usuario=admin
    @GetMapping
    public PageResponse<EventoResumen> buscar(AuditoriaFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    public EventoDetalle obtener(@PathVariable Long id) { return service.obtener(id); }
}