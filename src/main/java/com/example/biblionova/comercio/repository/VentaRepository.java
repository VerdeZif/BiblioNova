package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.Venta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Integer>, JpaSpecificationExecutor<Venta> {

    @Override
    @EntityGraph(attributePaths = {"lector"})
    Page<Venta> findAll(Specification<Venta> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"lector", "usuario", "pedido"})
    Optional<Venta> findWithDetalleByVentaId(Integer id);

    @EntityGraph(attributePaths = {"lector", "usuario", "pedido"})
    Optional<Venta> findWithDetalleByPedido_PedidoId(Long pedidoId);
}