package com.example.biblionova.prestamos.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.*;
import com.example.biblionova.prestamos.service.DevolucionService;
import com.example.biblionova.prestamos.service.PrestamoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
@GestionPrestamos
public class PrestamoController {
    private final PrestamoService prestamoService;
    private final DevolucionService devolucionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PrestamoResponse crear(@Valid @RequestBody PrestamoRequest r) {
        return prestamoService.crear(r);
    }

    @GetMapping
    public PageResponse<PrestamoResumen> buscar(PrestamoFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return prestamoService.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    public PrestamoResponse obtener(@PathVariable Integer id) {
        return prestamoService.obtener(id);
    }

    @PostMapping("/{id}/devoluciones")
    @ResponseStatus(HttpStatus.CREATED)
    public DevolucionResponse devolver(@PathVariable Integer id, @Valid @RequestBody DevolucionRequest r) {
        return devolucionService.registrar(id, r);
    }

    @PostMapping("/{id}/anular")
    public PrestamoResponse anular(@PathVariable Integer id, @Valid @RequestBody AnularPrestamoRequest r) {
        return prestamoService.anular(id, r);
    }
}
