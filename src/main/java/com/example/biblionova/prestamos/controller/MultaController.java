package com.example.biblionova.prestamos.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.*;
import com.example.biblionova.prestamos.service.MultaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prestamos/multas")
@RequiredArgsConstructor
public class MultaController {
    private final MultaService service;

    @GetMapping("/mias")
    @PreAuthorize("hasRole('CLIENTE')")
    public PageResponse<MultaResponse> mias(@PageableDefault(size = 20) Pageable pageable) {
        return service.mias(pageable);
    }

    @GetMapping
    @GestionPrestamos
    public PageResponse<MultaResponse> buscar(MultaFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    @GestionPrestamos
    public MultaDetalleResponse obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping("/{id}/pagos")
    @GestionPrestamos
    public MultaDetalleResponse pagar(@PathVariable Integer id, @Valid @RequestBody PagoMultaRequest r) {
        return service.pagar(id, r);
    }

    @PostMapping("/{id}/evaluacion")
    @GestionPrestamos
    public MultaDetalleResponse evaluar(@PathVariable Integer id, @Valid @RequestBody EvaluarMultaRequest r) {
        return service.evaluar(id, r);
    }

    @PostMapping("/{id}/anulacion")
    @GestionPrestamos
    public MultaDetalleResponse anular(@PathVariable Integer id, @Valid @RequestBody AnularMultaRequest r) {
        return service.anular(id, r);
    }
}
