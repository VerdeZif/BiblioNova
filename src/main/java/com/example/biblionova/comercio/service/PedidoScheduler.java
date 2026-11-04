package com.example.biblionova.comercio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PedidoScheduler {
    private final PedidoService service;

    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    public void expirar() {
        List<Long> ids = new ArrayList<>(service.idsPendientesVencidos());
        ids.addAll(service.idsRecojoVencido());
        for (Long id : ids) {
            try { service.expirarUno(id); }
            catch (RuntimeException e) { log.warn("No se pudo expirar el pedido {}: {}", id, e.getMessage()); }
        }
    }
}