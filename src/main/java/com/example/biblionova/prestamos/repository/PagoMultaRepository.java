package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.dto.PagadoPorMulta;
import com.example.biblionova.prestamos.entity.EstadoPagoMulta;
import com.example.biblionova.prestamos.entity.PagoMulta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface PagoMultaRepository extends JpaRepository<PagoMulta, Long> {

    @Query("select sum(p.montoPagado) from PagoMulta p where p.multa.multaId = :id and p.estado = :estado")
    BigDecimal totalPagado(@Param("id") Integer multaId, @Param("estado") EstadoPagoMulta estado);

    @Query("""
        select new com.example.biblionova.prestamos.dto.PagadoPorMulta(p.multa.multaId, sum(p.montoPagado))
        from PagoMulta p where p.multa.multaId in :ids and p.estado = :estado
        group by p.multa.multaId
        """)
    List<PagadoPorMulta> totalesPagados(@Param("ids") Collection<Integer> ids, @Param("estado") EstadoPagoMulta estado);

    @EntityGraph(attributePaths = {"metodoPago", "usuario"})
    List<PagoMulta> findByMulta_MultaIdOrderByFechaPagoAsc(Integer multaId);

    boolean existsByMulta_MultaIdAndEstado(Integer multaId, EstadoPagoMulta estado);
}
