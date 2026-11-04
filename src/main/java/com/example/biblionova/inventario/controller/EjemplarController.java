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
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventario/ejemplares")
@RequiredArgsConstructor
@GestionInventario
public class EjemplarController {
    private final EjemplarService service;

    @GetMapping
    public PageResponse<EjemplarResponse> buscar(EjemplarFiltro filtro,
                                                 @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}")
    public EjemplarResponse obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @GetMapping("/{id}/movimientos")
    public List<MovimientoResponse> historial(@PathVariable Integer id) {
        return service.historial(id);
    }

    @PostMapping("/{id}/cambio-estado")
    public EjemplarResponse cambiarEstado(@PathVariable Integer id, @Valid @RequestBody CambioEstadoRequest r) {
        return service.cambiarEstado(id, r);
    }

    @PatchMapping("/{id}")
    public EjemplarResponse actualizar(@PathVariable Integer id, @Valid @RequestBody ActualizarEjemplarRequest r) {
        return service.actualizar(id, r);
    }
}
