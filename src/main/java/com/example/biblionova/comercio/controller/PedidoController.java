package com.example.biblionova.comercio.controller;

import com.example.biblionova.comercio.dto.*;
import com.example.biblionova.comercio.repository.PedidoFiltro;
import com.example.biblionova.comercio.service.PedidoService;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.config.GestionPedidos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {
    private final PedidoService service;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')") @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse crear(@Valid @RequestBody PedidoRequest r) { return service.crear(r); }

    @GetMapping("/mios") @PreAuthorize("hasRole('CLIENTE')")
    public PageResponse<PedidoResumen> mios(@PageableDefault(size = 20) Pageable pageable) {
        return service.mios(pageable);
    }

    // Ej: ?estado=Pendiente&tipoEntrega=Delivery&q=PED-2026
    @GetMapping @GestionPedidos
    public PageResponse<PedidoResumen> buscar(PedidoFiltro filtro, @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(filtro, pageable);
    }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR','VENDEDOR')")
    public PedidoResponse obtener(@PathVariable Long id) { return service.obtener(id); }

    @PostMapping("/{id}/confirmar") @GestionPedidos
    public PedidoResponse confirmar(@PathVariable Long id) { return service.confirmar(id); }

    @PostMapping("/{id}/pagos/{pagoId}/confirmar") @GestionPedidos
    public PedidoResponse confirmarPago(@PathVariable Long id, @PathVariable Long pagoId,
                                        @Valid @RequestBody(required = false) ConfirmarPagoRequest r) {
        return service.confirmarPago(id, pagoId, r);
    }

    @PostMapping("/{id}/pagos/{pagoId}/pago-simulado") @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR')")
    public PedidoResponse pagoSimulado(@PathVariable Long id, @PathVariable Long pagoId,
                                       @Valid @RequestBody PagoSimuladoRequest r) {
        return service.pagarOnlineSimulado(id, pagoId, r.resultado());
    }

    @PostMapping("/{id}/pagos/reintentar") @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR')")
    public PedidoResponse reintentarPago(@PathVariable Long id) {
        return service.reintentarPagoOnline(id);
    }

    @PostMapping("/{id}/estado") @GestionPedidos
    public PedidoResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstadoPedidoRequest r) {
        return service.cambiarEstado(id, r);
    }

    @PostMapping("/{id}/cancelar") @PreAuthorize("hasAnyRole('CLIENTE','ADMINISTRADOR','VENDEDOR')")
    public PedidoResponse cancelar(@PathVariable Long id, @Valid @RequestBody MotivoRequest r) {
        return service.cancelar(id, r);
    }
}