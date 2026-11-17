
package com.biblionova.jsf.service;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.entity.Prestamo;
import com.biblionova.jsf.repository.PrestamoRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.LocalDate;

@ApplicationScoped
public class DevolucionService {

    @Inject
    private PrestamoRepository prestamoRepository;

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    @Transactional
    public void registrarDevolucion(Long prestamoId) {

        if (prestamoId == null) {
            throw new IllegalArgumentException(
                    "Debes seleccionar un préstamo."
            );
        }

        // Bloquear el préstamo para evitar devoluciones simultáneas.
        Prestamo prestamo =
                prestamoRepository.bloquearPrestamo(prestamoId);

        if (prestamo == null) {
            throw new IllegalArgumentException(
                    "El préstamo seleccionado no existe."
            );
        }

        if (!"Activo".equals(prestamo.getEstado())) {
            throw new IllegalStateException(
                    "Este préstamo ya fue finalizado."
            );
        }

        // Bloquear el ejemplar asociado.
        Long ejemplarId = prestamo.getEjemplar().getId();

        Ejemplar ejemplar = em.find(
                Ejemplar.class,
                ejemplarId,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (ejemplar == null) {
            throw new IllegalStateException(
                    "No se encontró el ejemplar del préstamo."
            );
        }

        if (!"Prestado".equals(ejemplar.getEstado())) {
            throw new IllegalStateException(
                    "El ejemplar no tiene estado Prestado."
            );
        }

        // Registrar la devolución.
        prestamo.setFechaDevolucion(LocalDate.now());
        prestamo.setEstado("Devuelto");

        // Liberar el ejemplar para nuevos préstamos.
        ejemplar.setEstado("Disponible");
    }
}
