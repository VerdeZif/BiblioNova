package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.entity.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    @Query("""
        select m from Movimiento m join fetch m.usuario
        where m.ejemplar.ejemplarId = :id
        order by m.fechaMovimiento desc, m.movimientoId desc
        """)
    List<Movimiento> historial(@Param("id") Integer ejemplarId);
}
