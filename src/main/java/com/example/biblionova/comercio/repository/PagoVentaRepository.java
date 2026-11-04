package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.PagoVenta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoVentaRepository extends JpaRepository<PagoVenta, Long> {
    @EntityGraph(attributePaths = {"metodoPago", "usuario"})
    List<PagoVenta> findByVenta_VentaIdOrderByFechaRegistroAsc(Integer ventaId);
}