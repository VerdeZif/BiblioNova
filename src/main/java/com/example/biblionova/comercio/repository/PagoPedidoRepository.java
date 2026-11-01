package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.EstadoRegistroPago;
import com.example.biblionova.comercio.entity.PagoPedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PagoPedidoRepository extends JpaRepository<PagoPedido, Long> {

    @EntityGraph(attributePaths = {"metodoPago", "confirmadoPor"})
    List<PagoPedido> findByPedido_PedidoIdOrderByFechaRegistroAsc(Long pedidoId);

    @EntityGraph(attributePaths = {"metodoPago"})
    Optional<PagoPedido> findByPagoPedidoIdAndPedido_PedidoId(Long pagoId, Long pedidoId);

    @Query("select coalesce(sum(p.monto), 0) from PagoPedido p where p.pedido.pedidoId = :id and p.estado = :estado")
    BigDecimal totalPorEstado(@Param("id") Long pedidoId, @Param("estado") EstadoRegistroPago estado);
}