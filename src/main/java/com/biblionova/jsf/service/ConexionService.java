package com.biblionova.jsf.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ApplicationScoped
public class ConexionService {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    public boolean verificarConexion() {
        Object resultado = em.createNativeQuery("SELECT 1")
                .getSingleResult();

        return resultado != null
                && ((Number) resultado).intValue() == 1;
    }
}
