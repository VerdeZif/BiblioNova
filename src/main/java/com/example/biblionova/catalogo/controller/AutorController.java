package com.example.biblionova.catalogo.controller;

import com.example.biblionova.catalogo.dto.AutorRequest;
import com.example.biblionova.catalogo.dto.AutorResponse;
import com.example.biblionova.catalogo.service.AutorService;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionCatalogo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalogo/autores")
@RequiredArgsConstructor
public class AutorController {
    private final AutorService service;

    @GetMapping
    public PageResponse<AutorResponse> buscar(@RequestParam(required = false) String q,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(q, pageable);
    }

    @GetMapping("/{id}")
    public AutorResponse obtener(@PathVariable Integer id) { return service.obtener(id); }

    @PostMapping
    @GestionCatalogo
    @ResponseStatus(HttpStatus.CREATED)
    public AutorResponse crear(@Valid @RequestBody AutorRequest r) { return service.crear(r); }

    @PutMapping("/{id}")
    @GestionCatalogo
    public AutorResponse actualizar(@PathVariable Integer id, @Valid @RequestBody AutorRequest r) {
        return service.actualizar(id, r);
    }

    @DeleteMapping("/{id}")
    @GestionCatalogo
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) { service.eliminar(id); }
}
