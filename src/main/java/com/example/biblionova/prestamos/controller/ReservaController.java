package com.example.biblionova.prestamos.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.ReservaFiltro;
import com.example.biblionova.prestamos.dto.ReservaRequest;
import com.example.biblionova.prestamos.dto.ReservaResponse;
import com.example.biblionova.prestamos.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {
    private final ReservaService service;

    // Cliente: reserva para sí mismo. Personal: debe indicar lectorId
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR','BIBLIOTECARIO')")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crear(@Valid @RequestBody ReservaRequest r) {
        return service.crear(r);
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('CLIENTE')")
    public List<ReservaResponse> mias() {
        return service.mias();
    }

    @GetMapping
    @GestionPrestamos
    public PageResponse<ReservaResponse> buscar(ReservaFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR','BIBLIOTECARIO')")
    public ReservaResponse cancelar(@PathVariable Long id) {
        return service.cancelar(id);
    }
}
