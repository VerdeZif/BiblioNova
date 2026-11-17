package com.biblionova.jsf.repository;

import com.biblionova.jsf.entity.Usuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UsuarioRepository {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    // Registrar un usuario universitario.
    @Transactional
    public void guardar(Usuario usuario) {
        em.persist(usuario);
    }

    // Consultar los usuarios registrados.
    public List<Usuario> listar() {
        return em.createQuery(
                "SELECT u FROM Usuario u ORDER BY u.id DESC",
                Usuario.class
        ).getResultList();
    }

    // Buscar un usuario por su ID.
    public Usuario buscarPorId(Long id) {
        return em.find(Usuario.class, id);
    }

    // Buscar un usuario por su código universitario.
    public Usuario buscarPorCodigo(String codigo) {
        return em.createQuery(
                        "SELECT u FROM Usuario u WHERE u.codigo = :codigo",
                        Usuario.class
                )
                .setParameter("codigo", codigo)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }
}
