
package com.biblionova.jsf.service;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.entity.Prestamo;
import com.biblionova.jsf.entity.Usuario;
import com.biblionova.jsf.repository.PrestamoRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.LocalDate;

@ApplicationScoped
public class PrestamoService {

    @Inject
    private PrestamoRepository prestamoRepository;

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    @Transactional
    public void registrarPrestamo(
            Long usuarioId,
            Long ejemplarId,
            LocalDate fechaVencimiento) {

        if (usuarioId == null || ejemplarId == null) {
            throw new IllegalArgumentException(
                    "Debes seleccionar un estudiante y un ejemplar."
            );
        }

        if (fechaVencimiento == null ||
                !fechaVencimiento.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de vencimiento debe ser posterior a hoy."
            );
        }

        // Bloqueamos al usuario para serializar sus préstamos.
        Usuario usuario = em.find(
                Usuario.class,
                usuarioId,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (usuario == null) {
            throw new IllegalArgumentException(
                    "El usuario seleccionado no existe."
            );
        }

        if (!usuario.isActivo()){
            throw new IllegalStateException(
                    "El usuario está inactivo."
            );
        }

        // Verificar el máximo de 3 préstamos activos.
        long prestamosActivos =
                prestamoRepository.contarPrestamosActivos(usuarioId);

        if (prestamosActivos >= 3) {
            throw new IllegalStateException(
                    "El estudiante ya tiene 3 préstamos activos."
            );
        }

        // Bloquear el ejemplar para evitar préstamos simultáneos.
        Ejemplar ejemplar =
                prestamoRepository.bloquearEjemplar(ejemplarId);

        if (ejemplar == null) {
            throw new IllegalArgumentException(
                    "El ejemplar seleccionado no existe."
            );
        }

        if (!"Disponible".equals(ejemplar.getEstado())) {
            throw new IllegalStateException(
                    "El ejemplar no está disponible."
            );
        }

        // Crear préstamo.
        Prestamo prestamo = new Prestamo();

        prestamo.setUsuario(usuario);
        prestamo.setEjemplar(ejemplar);
        prestamo.setFechaPrestamo(LocalDate.now());
        prestamo.setFechaVencimiento(fechaVencimiento);
        prestamo.setEstado("Activo");

        // Actualizar disponibilidad.
        ejemplar.setEstado("Prestado");

        // Guardar usando JPA.
        prestamoRepository.guardar(prestamo);
    }
}
