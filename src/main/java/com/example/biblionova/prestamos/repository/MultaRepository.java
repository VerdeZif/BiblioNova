package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.EstadoMulta;
import com.example.biblionova.prestamos.entity.Multa;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface MultaRepository extends JpaRepository<Multa, Integer>, JpaSpecificationExecutor<Multa> {

    @Override
    @EntityGraph(attributePaths = {"detallePrestamo", "detallePrestamo.prestamo",
            "detallePrestamo.prestamo.lector", "detallePrestamo.ejemplar", "evaluadaPor"})
    Page<Multa> findAll(Specification<Multa> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"detallePrestamo", "detallePrestamo.prestamo",
            "detallePrestamo.prestamo.lector", "detallePrestamo.ejemplar", "evaluadaPor"})
    Optional<Multa> findWithDetalleByMultaId(Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Multa m where m.multaId = :id")
    Optional<Multa> bloquearPorId(@Param("id") Integer id);

    @Query("""
        select case when count(m) > 0 then true else false end from Multa m
        where m.detallePrestamo.prestamo.lector.lectorId = :lectorId
          and m.estado in (com.example.biblionova.prestamos.entity.EstadoMulta.Pendiente,
                           com.example.biblionova.prestamos.entity.EstadoMulta.Parcial)
        """)
    boolean existeDeuda(@Param("lectorId") Integer lectorId);
}
