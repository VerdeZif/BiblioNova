
package com.biblionova.jsf.repository;

import com.biblionova.jsf.entity.Libro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class LibroRepository {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    // Guardar un libro en MySQL.
    @Transactional
    public void guardar(Libro libro) {
        em.persist(libro);
    }

    // Consultar todos los libros.
    public List<Libro> listar() {
        return em.createQuery(
                "SELECT l FROM Libro l ORDER BY l.id DESC",
                Libro.class
        ).getResultList();
    }

    // Buscar un libro por su identificador.
    public Libro buscarPorId(Long id) {
        return em.find(Libro.class, id);
    }
}
