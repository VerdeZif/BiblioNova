package com.example.biblionova.catalogo.controller;

import com.example.biblionova.catalogo.dto.EditorialRequest;
import com.example.biblionova.catalogo.dto.EditorialResponse;
import com.example.biblionova.catalogo.service.EditorialService;
import com.example.biblionova.config.GestionCatalogo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/catalogo/editoriales")
@RequiredArgsConstructor
public class EditorialController {
    private final EditorialService service;

    @GetMapping
    public List<EditorialResponse> listar() { return service.listar(); }

    @PostMapping
    @GestionCatalogo
    @ResponseStatus(HttpStatus.CREATED)
    public EditorialResponse crear(@Valid @RequestBody EditorialRequest r) { return service.crear(r); }

    @PutMapping("/{id}")
    @GestionCatalogo
    public EditorialResponse actualizar(@PathVariable Integer id, @Valid @RequestBody EditorialRequest r) {
        return service.actualizar(id, r);
    }

    @DeleteMapping("/{id}")
    @GestionCatalogo
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) { service.eliminar(id); }
}
