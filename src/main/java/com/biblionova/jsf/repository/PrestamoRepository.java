package com.biblionova.jsf.repository;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.entity.Prestamo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class PrestamoRepository {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    // Consultar todos los préstamos.
    public List<Prestamo> listar() {
        return em.createQuery(
                "SELECT p FROM Prestamo p " +
                        "JOIN FETCH p.usuario " +
                        "JOIN FETCH p.ejemplar " +
                        "JOIN FETCH p.ejemplar.libro " +
                        "ORDER BY p.id DESC",
                Prestamo.class
        ).getResultList();
    }

    // Contar préstamos activos de un estudiante.
    public long contarPrestamosActivos(Long usuarioId) {
        return em.createQuery(
                        "SELECT COUNT(p) FROM Prestamo p " +
                                "WHERE p.usuario.id = :usuarioId " +
                                "AND p.estado = :estado",
                        Long.class
                )
                .setParameter("usuarioId", usuarioId)
                .setParameter("estado", "Activo")
                .getSingleResult();
    }

    // Bloquear el ejemplar mientras se registra el préstamo.
    public Ejemplar bloquearEjemplar(Long ejemplarId) {
        return em.find(
                Ejemplar.class,
                ejemplarId,
                LockModeType.PESSIMISTIC_WRITE
        );
    }

    // Guardar el préstamo dentro de una transacción activa.
    public void guardar(Prestamo prestamo) {
        em.persist(prestamo);
    }


    public Prestamo bloquearPrestamo(Long prestamoId) {
        return em.find(
                Prestamo.class,
                prestamoId,
                LockModeType.PESSIMISTIC_WRITE
        );
    }

}
