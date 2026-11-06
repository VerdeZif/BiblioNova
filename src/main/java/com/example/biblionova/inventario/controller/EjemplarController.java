
package com.example.biblionova.inventario.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionInventario;

import com.example.biblionova.inventario.dto.ActualizarEjemplarRequest;
import com.example.biblionova.inventario.dto.CambioEstadoRequest;
import com.example.biblionova.inventario.dto.EjemplarFiltro;
import com.example.biblionova.inventario.dto.EjemplarResponse;
import com.example.biblionova.inventario.dto.MovimientoResponse;

import com.example.biblionova.inventario.service.EjemplarService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario/ejemplares")
@RequiredArgsConstructor
public class EjemplarController {

    private final EjemplarService service;

    // CONSULTA: Administrador, Bibliotecario y Vendedor.
    @GetMapping
    @PreAuthorize(
            "hasAnyRole('ADMINISTRADOR','BIBLIOTECARIO','VENDEDOR')"
    )
    public PageResponse<EjemplarResponse> buscar(
            EjemplarFiltro filtro,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return service.buscar(filtro, pageable);
    }

    // DETALLE: conserva la autorización de inventario.
    @GetMapping("/{id}")
    @GestionInventario
    public EjemplarResponse obtener(
            @PathVariable Integer id
    ) {
        return service.obtener(id);
    }

    // HISTORIAL: conserva la autorización de inventario.
    @GetMapping("/{id}/movimientos")
    @GestionInventario
    public List<MovimientoResponse> historial(
            @PathVariable Integer id
    ) {
        return service.historial(id);
    }

    // MODIFICACIÓN: solo roles autorizados a gestionar inventario.
    @PostMapping("/{id}/cambio-estado")
    @GestionInventario
    public EjemplarResponse cambiarEstado(
            @PathVariable Integer id,
            @Valid @RequestBody CambioEstadoRequest r
    ) {
        return service.cambiarEstado(id, r);
    }

    // ACTUALIZACIÓN: solo roles autorizados a gestionar inventario.
    @PatchMapping("/{id}")
    @GestionInventario
    public EjemplarResponse actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarEjemplarRequest r
    ) {
        return service.actualizar(id, r);
    }
}
