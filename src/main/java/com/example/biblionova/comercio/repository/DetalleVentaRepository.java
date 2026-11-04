package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {
    @Query("""
        select d from DetalleVenta d join fetch d.ejemplar e join fetch e.libro
        where d.venta.ventaId = :id order by d.detalleVentaId
        """)
    List<DetalleVenta> porVenta(@Param("id") Integer ventaId);
}