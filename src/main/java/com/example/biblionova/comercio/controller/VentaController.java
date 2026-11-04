package com.example.biblionova.comercio.controller;

import com.example.biblionova.comercio.dto.VentaPresencialRequest;
import com.example.biblionova.comercio.dto.VentaResponse;
import com.example.biblionova.comercio.dto.VentaResumen;
import com.example.biblionova.comercio.dto.VentaFiltro;
import com.example.biblionova.comercio.service.VentaService;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPedidos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
@GestionPedidos
public class VentaController {
    private final VentaService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse registrar(@Valid @RequestBody VentaPresencialRequest r) {
        return service.registrarPresencial(r);
    }

    // Ej: ?canal=Presencial&desde=2026-10-30&hasta=2026-10-30&q=VEN-2026
    @GetMapping
    public PageResponse<VentaResumen> buscar(VentaFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    public VentaResponse obtener(@PathVariable Integer id) { return service.obtener(id); }

    @GetMapping("/pedido/{pedidoId}")
    public VentaResponse obtenerPorPedido(@PathVariable Long pedidoId) { return service.obtenerPorPedido(pedidoId); }
}