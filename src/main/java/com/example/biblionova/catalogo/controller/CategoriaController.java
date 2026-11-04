package com.example.biblionova.catalogo.controller;

import com.example.biblionova.catalogo.dto.CategoriaRequest;
import com.example.biblionova.catalogo.dto.CategoriaResponse;
import com.example.biblionova.catalogo.service.CategoriaService;
import com.example.biblionova.config.GestionCatalogo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/catalogo/categorias")
@RequiredArgsConstructor
public class CategoriaController {
    private final CategoriaService service;

    @GetMapping
    public List<CategoriaResponse> listar() { return service.listar(true); }

    @GetMapping("/gestion")
    @GestionCatalogo
    public List<CategoriaResponse> listarTodas() { return service.listar(false); }

    @PostMapping
    @GestionCatalogo
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest r) { return service.crear(r); }

    @PutMapping("/{id}")
    @GestionCatalogo
    public CategoriaResponse actualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaRequest r) {
        return service.actualizar(id, r);
    }

    @DeleteMapping("/{id}")
    @GestionCatalogo
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) { service.eliminar(id); }
}
