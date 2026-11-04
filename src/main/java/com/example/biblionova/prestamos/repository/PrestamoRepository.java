package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.Prestamo;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock; // <-- ASEGÚRATE DE QUE ESTÉ ESTE IMPORT
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;


public interface PrestamoRepository extends JpaRepository<Prestamo, Integer>, JpaSpecificationExecutor<Prestamo> {

    @Override
    @EntityGraph(attributePaths = {"lector"})
    Page<Prestamo> findAll(Specification<Prestamo> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"lector", "usuario", "politica"})
    Optional<Prestamo> findWithDetalleByPrestamoId(Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Prestamo p where p.prestamoId = :id")
    Optional<Prestamo> bloquearPorId(@Param("id") Integer id);
}
