package com.example.biblionova.prestamos.controller;

import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.PoliticaRequest;
import com.example.biblionova.prestamos.dto.PoliticaResponse;
import com.example.biblionova.prestamos.service.PoliticaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prestamos/politicas")
@RequiredArgsConstructor
public class PoliticaController {
    private final PoliticaService service;

    @GetMapping
    @GestionPrestamos
    public List<PoliticaResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public PoliticaResponse crear(@Valid @RequestBody PoliticaRequest r) {
        return service.crear(r);
    }

    @PostMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public PoliticaResponse activar(@PathVariable Integer id) {
        return service.activar(id);
    }
}
