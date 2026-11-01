package com.example.biblionova.inventario.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionInventario;
import com.example.biblionova.inventario.dto.RecepcionRequest;
import com.example.biblionova.inventario.dto.RecepcionResponse;
import com.example.biblionova.inventario.dto.RecepcionResumen;
import com.example.biblionova.inventario.service.RecepcionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventario/recepciones")
@RequiredArgsConstructor
@GestionInventario
public class RecepcionController {
    private final RecepcionService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecepcionResponse registrar(@Valid @RequestBody RecepcionRequest r) {
        return service.registrar(r);
    }

    @GetMapping
    public PageResponse<RecepcionResumen> listar(@PageableDefault(size = 20) Pageable pageable) {
        return service.listar(pageable);
    }

    @GetMapping("/{id}")
    public RecepcionResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }
}
