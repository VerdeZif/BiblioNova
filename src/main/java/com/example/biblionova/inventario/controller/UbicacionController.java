package com.example.biblionova.inventario.controller;

import com.example.biblionova.config.GestionInventario;
import com.example.biblionova.inventario.dto.UbicacionRequest;
import com.example.biblionova.inventario.dto.UbicacionResponse;
import com.example.biblionova.inventario.service.UbicacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventario/ubicaciones")
@RequiredArgsConstructor
@GestionInventario
public class UbicacionController {
    private final UbicacionService service;

    @GetMapping
    public List<UbicacionResponse> listar(@RequestParam(defaultValue = "false") boolean soloActivas) {
        return service.listar(soloActivas);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UbicacionResponse crear(@Valid @RequestBody UbicacionRequest r) {
        return service.crear(r);
    }

    @PutMapping("/{id}")
    public UbicacionResponse actualizar(@PathVariable Integer id, @Valid @RequestBody UbicacionRequest r) {
        return service.actualizar(id, r);
    }
}
