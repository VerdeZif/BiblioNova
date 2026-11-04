package com.example.biblionova.prestamos.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.LectorRequest;
import com.example.biblionova.prestamos.dto.LectorResponse;
import com.example.biblionova.prestamos.service.LectorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prestamos/lectores")
@RequiredArgsConstructor
public class LectorController {
    private final LectorService service;

    @GetMapping("/yo")
    public LectorResponse yo() {
        return service.delUsuarioActual();
    }

    @GetMapping
    @GestionPrestamos
    public PageResponse<LectorResponse> buscar(@RequestParam(required = false) String q,
                                               @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(q, pageable);
    }

    @GetMapping("/{id}")
    @GestionPrestamos
    public LectorResponse obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping
    @GestionPrestamos
    @ResponseStatus(HttpStatus.CREATED)
    public LectorResponse crear(@Valid @RequestBody LectorRequest r) {
        return service.crear(r);
    }

    @PutMapping("/{id}")
    @GestionPrestamos
    public LectorResponse actualizar(@PathVariable Integer id, @Valid @RequestBody LectorRequest r) {
        return service.actualizar(id, r);
    }

    @PatchMapping("/{id}/activo")
    @GestionPrestamos
    public LectorResponse cambiarActivo(@PathVariable Integer id, @RequestParam boolean valor) {
        return service.cambiarActivo(id, valor);
    }
}
