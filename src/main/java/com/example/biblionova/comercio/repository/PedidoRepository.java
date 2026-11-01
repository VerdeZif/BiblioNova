package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.EstadoPedido;
import com.example.biblionova.comercio.entity.Pedido;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long>, JpaSpecificationExecutor<Pedido> {

    @Override
    @EntityGraph(attributePaths = {"lector"})
    Page<Pedido> findAll(Specification<Pedido> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"lector", "direccion"})
    Optional<Pedido> findWithDetalleByPedidoId(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pedido p where p.pedidoId = :id")
    Optional<Pedido> bloquearPorId(@Param("id") Long id);

    long countByLector_LectorIdAndEstado(Integer lectorId, EstadoPedido estado);
    boolean existsByDireccion_DireccionIdAndEstadoNotIn(Long direccionId, Collection<EstadoPedido> estados);

    @Query("""
        select p.pedidoId from Pedido p
        where p.estado = com.example.biblionova.comercio.entity.EstadoPedido.Pendiente and p.fechaPedido < :limite
        """)
    List<Long> idsPendientesVencidos(@Param("limite") LocalDateTime limite);
}
