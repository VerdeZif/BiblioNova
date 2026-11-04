package com.example.biblionova.comercio.controller;

import com.example.biblionova.comercio.dto.DireccionRequest;
import com.example.biblionova.comercio.dto.DireccionResponse;
import com.example.biblionova.comercio.service.DireccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos/direcciones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class DireccionController {
    private final DireccionService service;

    @GetMapping
    public List<DireccionResponse> listar() { return service.listar(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DireccionResponse crear(@Valid @RequestBody DireccionRequest r) { return service.crear(r); }

    @PutMapping("/{id}")
    public DireccionResponse actualizar(@PathVariable Long id, @Valid @RequestBody DireccionRequest r) {
        return service.actualizar(id, r);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) { service.eliminar(id); }
}