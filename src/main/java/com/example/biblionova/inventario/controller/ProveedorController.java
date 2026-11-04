package com.example.biblionova.inventario.controller;

import com.example.biblionova.config.GestionInventario;
import com.example.biblionova.inventario.dto.ProveedorRequest;
import com.example.biblionova.inventario.dto.ProveedorResponse;
import com.example.biblionova.inventario.service.ProveedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventario/proveedores")
@RequiredArgsConstructor
@GestionInventario
public class ProveedorController {
    private final ProveedorService service;

    @GetMapping
    public List<ProveedorResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProveedorResponse crear(@Valid @RequestBody ProveedorRequest r) {
        return service.crear(r);
    }

    @PutMapping("/{id}")
    public ProveedorResponse actualizar(@PathVariable Integer id, @Valid @RequestBody ProveedorRequest r) {
        return service.actualizar(id, r);
    }
}
