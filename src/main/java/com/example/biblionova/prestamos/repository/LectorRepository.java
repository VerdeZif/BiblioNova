package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.Lector;
import jakarta.persistence.LockModeType; // <-- Este se usa DENTRO del paréntesis del @Lock
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock; // <-- ASEGÚRATE DE QUE ESTÉ ESTE IMPORT
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface LectorRepository extends JpaRepository<Lector, Integer> {

    Optional<Lector> findByUsuario_UsuarioId(Integer usuarioId);
    boolean existsByDocumento(String documento);
    boolean existsByDocumentoAndLectorIdNot(String documento, Integer id);

    @Query("""
        select l from Lector l
        where lower(l.documento) like :q or lower(l.nombres) like :q
           or lower(l.apellidos) like :q or lower(coalesce(l.correo, '')) like :q
        """)
    Page<Lector> buscar(@Param("q") String q, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Lector l where l.lectorId = :id")
    Optional<Lector> bloquearPorId(@Param("id") Integer id);
}
