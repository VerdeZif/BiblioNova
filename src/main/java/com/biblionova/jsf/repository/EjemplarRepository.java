package com.biblionova.jsf.repository;

import com.biblionova.jsf.entity.Ejemplar;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class EjemplarRepository {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    @Transactional
    public void guardar(Ejemplar ejemplar) {
        em.persist(ejemplar);
    }

    public List<Ejemplar> listar() {
        return em.createQuery(
                "SELECT e FROM Ejemplar e JOIN FETCH e.libro ORDER BY e.id DESC",
                Ejemplar.class
        ).getResultList();
    }
}
