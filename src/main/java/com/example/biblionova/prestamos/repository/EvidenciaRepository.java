package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.Evidencia;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {
    @EntityGraph(attributePaths = "usuario")
    List<Evidencia> findByEjemplar_EjemplarIdOrderByFechaRegistroDesc(Integer ejemplarId);

    long countByDetallePrestamo_DetallePrestamoId(Integer detallePrestamoId);

    /** Conservación (R11): una foto no se borra mientras su multa siga abierta. */
    @Query("""
        select e from Evidencia e
        where e.fechaRegistro < :limite
          and not exists (
            select 1 from Multa m
            where m.detallePrestamo = e.detallePrestamo
              and m.estado in (com.example.biblionova.prestamos.entity.EstadoMulta.Pendiente,
                               com.example.biblionova.prestamos.entity.EstadoMulta.Parcial,
                               com.example.biblionova.prestamos.entity.EstadoMulta.EnRevision))
        order by e.fechaRegistro
        """)
    List<Evidencia> vencidas(@Param("limite") LocalDateTime limite, Pageable pageable);
}