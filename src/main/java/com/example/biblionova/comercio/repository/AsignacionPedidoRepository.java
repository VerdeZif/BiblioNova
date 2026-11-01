package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.AsignacionPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AsignacionPedidoRepository extends JpaRepository<AsignacionPedido, Long> {

    @Query("""
        select a from AsignacionPedido a join fetch a.ejemplar
        where a.detallePedido.pedido.pedidoId = :id and a.fechaLiberacion is null
        order by a.asignacionId
        """)
    List<AsignacionPedido> activasConEjemplar(@Param("id") Long pedidoId);
}