package com.example.biblionova.prestamos.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservaScheduler {
    private final ReservaService service;

    // Respaldo: vence reservas y asigna ejemplares que quedaron libres por otras vías (recepción, reparación...)
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void mantener() {
        for (Long id : service.idsVencidas()) {
            try { service.expirarUna(id); }
            catch (RuntimeException e) { log.warn("No se pudo vencer la reserva {}: {}", id, e.getMessage()); }
        }
        for (Integer libroId : service.libroIdsConPendientes()) {
            try { service.asignarDisponibles(libroId); }
            catch (RuntimeException e) { log.warn("No se pudo asignar reservas del libro {}: {}", libroId, e.getMessage()); }
        }
    }
}
