package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Long> {
    @Query("select d from DetallePedido d join fetch d.libro where d.pedido.pedidoId = :id order by d.detallePedidoId")
    List<DetallePedido> porPedido(@Param("id") Long pedidoId);
}