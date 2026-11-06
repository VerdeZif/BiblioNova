
package com.example.biblionova.prestamos.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.prestamos.dto.PrestamoResponse;
import com.example.biblionova.prestamos.dto.PrestamoResumen;
import com.example.biblionova.prestamos.service.PrestamoService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prestamos/mios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class MisPrestamosController {

    private final PrestamoService prestamoService;

    @GetMapping
    public PageResponse<PrestamoResumen> listar(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return prestamoService.misPrestamos(pageable);
    }

    @GetMapping("/{id}")
    public PrestamoResponse obtener(
            @PathVariable Integer id
    ) {
        return prestamoService.obtenerMiPrestamo(id);
    }
}
