
package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.Lector;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LectorRepository extends JpaRepository<Lector, Integer> {

    Optional<Lector> findByUsuario_UsuarioId(Integer usuarioId);

    boolean existsByDocumento(String documento);

    boolean existsByDocumentoAndLectorIdNot(
            String documento,
            Integer id
    );

    // Buscar por DNI, nombres, apellidos, nombre completo o correo.
    @Query("""
        SELECT l
        FROM Lector l
        WHERE LOWER(l.documento) LIKE :q
           OR LOWER(l.nombres) LIKE :q
           OR LOWER(l.apellidos) LIKE :q
           OR LOWER(COALESCE(l.correo, '')) LIKE :q
           OR LOWER(
                CONCAT(
                    CONCAT(
                        COALESCE(l.nombres, ''),
                        ' '
                    ),
                    COALESCE(l.apellidos, '')
                )
           ) LIKE :q
        """)
    Page<Lector> buscar(
            @Param("q") String q,
            Pageable pageable
    );

    // Bloquear lector durante operaciones que requieren concurrencia segura.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT l
        FROM Lector l
        WHERE l.lectorId = :id
        """)
    Optional<Lector> bloquearPorId(
            @Param("id") Integer id
    );
}
