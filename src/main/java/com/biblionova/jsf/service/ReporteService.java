
package com.biblionova.jsf.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class ReporteService {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    // Total de libros registrados.
    public long contarLibros() {
        return em.createQuery(
                "SELECT COUNT(l) FROM Libro l",
                Long.class
        ).getSingleResult();
    }

    // Total de ejemplares físicos.
    public long contarEjemplares() {
        return em.createQuery(
                "SELECT COUNT(e) FROM Ejemplar e",
                Long.class
        ).getSingleResult();
    }

    // Ejemplares disponibles.
    public long contarEjemplaresDisponibles() {
        return em.createQuery(
                        "SELECT COUNT(e) FROM Ejemplar e " +
                                "WHERE e.estado = :estado",
                        Long.class
                )
                .setParameter("estado", "Disponible")
                .getSingleResult();
    }

    // Usuarios universitarios activos.
    public long contarUsuariosActivos() {
        return em.createQuery(
                "SELECT COUNT(u) FROM Usuario u " +
                        "WHERE u.activo = true",
                Long.class
        ).getSingleResult();
    }

    // Préstamos activos.
    public long contarPrestamosActivos() {
        return em.createQuery(
                        "SELECT COUNT(p) FROM Prestamo p " +
                                "WHERE p.estado = :estado",
                        Long.class
                )
                .setParameter("estado", "Activo")
                .getSingleResult();
    }

    // Préstamos devueltos.
    public long contarPrestamosDevueltos() {
        return em.createQuery(
                        "SELECT COUNT(p) FROM Prestamo p " +
                                "WHERE p.estado = :estado",
                        Long.class
                )
                .setParameter("estado", "Devuelto")
                .getSingleResult();
    }

    // Total de préstamos por libro.
    // Cada resultado contiene: título y cantidad de préstamos.
    public List<Object[]> prestamosPorLibro() {
        return em.createQuery(
                "SELECT l.titulo, COUNT(p) " +
                        "FROM Prestamo p " +
                        "JOIN p.ejemplar e " +
                        "JOIN e.libro l " +
                        "GROUP BY l.id, l.titulo " +
                        "ORDER BY COUNT(p) DESC",
                Object[].class
        ).getResultList();
    }
}
