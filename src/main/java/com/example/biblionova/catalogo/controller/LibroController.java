package com.example.biblionova.catalogo.controller;

import com.example.biblionova.catalogo.dto.LibroFiltro;
import com.example.biblionova.catalogo.dto.LibroRequest;
import com.example.biblionova.catalogo.dto.LibroResponse;
import com.example.biblionova.catalogo.service.LibroService;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionCatalogo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalogo/libros")
@RequiredArgsConstructor
public class LibroController {
    private final LibroService service;

    @GetMapping
    public PageResponse<LibroResponse> buscar(LibroFiltro filtro,
                                              @PageableDefault(size = 12) Pageable pageable) {
        return service.buscar(filtro, pageable, true);
    }

    @GetMapping("/{id}")
    public LibroResponse obtener(@PathVariable Integer id) {
        return service.obtener(id, true);
    }

    @GetMapping("/gestion")
    @GestionCatalogo
    public PageResponse<LibroResponse> buscarGestion(LibroFiltro filtro,
                                                     @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable, false);
    }

    @GetMapping("/gestion/{id}")
    @GestionCatalogo
    public LibroResponse obtenerGestion(@PathVariable Integer id) {
        return service.obtener(id, false);
    }

    @PostMapping
    @GestionCatalogo
    @ResponseStatus(HttpStatus.CREATED)
    public LibroResponse crear(@Valid @RequestBody LibroRequest r) {
        return service.crear(r);
    }

    @PutMapping("/{id}")
    @GestionCatalogo
    public LibroResponse actualizar(@PathVariable Integer id, @Valid @RequestBody LibroRequest r) {
        return service.actualizar(id, r);
    }

    @PatchMapping("/{id}/activo")
    @GestionCatalogo
    public LibroResponse cambiarActivo(@PathVariable Integer id, @RequestParam boolean valor) {
        return service.cambiarActivo(id, valor);
    }
}
