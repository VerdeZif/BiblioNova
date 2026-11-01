package com.example.biblionova.seguridad.repository;

import com.example.biblionova.seguridad.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer>, JpaSpecificationExecutor<Usuario> {

    @Query("""
        select u from Usuario u
        join fetch u.rol r
        left join fetch r.permisos
        where u.nombreUsuario = :nombre
        """)
    Optional<Usuario> buscarConRol(@Param("nombre") String nombre);

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    long countByNombreUsuarioNot(String nombreUsuario);
    boolean existsByNombreUsuario(String nombreUsuario);
    boolean existsByCorreo(String correo);

    long countByRol_NombreAndActivoTrue(String rolNombre);
    boolean existsByCorreoAndUsuarioIdNot(String correo, Integer usuarioId);

    @Override
    @EntityGraph(attributePaths = "rol")
    Page<Usuario> findAll(Specification<Usuario> spec, Pageable pageable);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update Usuario u set u.ultimoAcceso = :fecha where u.usuarioId = :id")
    void registrarAcceso(@Param("id") Integer id, @Param("fecha") LocalDateTime fecha);



}