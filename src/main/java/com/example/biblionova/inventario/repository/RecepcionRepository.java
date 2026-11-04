package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.entity.Recepcion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RecepcionRepository extends JpaRepository<Recepcion, Long> {
    @Override
    @EntityGraph(attributePaths = {"proveedor", "usuario"})
    Page<Recepcion> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"proveedor", "usuario"})
    Optional<Recepcion> findWithDetailByRecepcionId(Long id);
}
