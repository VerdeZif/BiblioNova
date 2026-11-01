package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.Envio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EnvioRepository extends JpaRepository<Envio, Long> {
    Optional<Envio> findByPedido_PedidoId(Long pedidoId);

    @Query("""
        select e.pedido.pedidoId from Envio e
        where e.pedido.estado = com.example.biblionova.comercio.entity.EstadoPedido.ListoRecojo
          and e.pedido.estadoPago <> com.example.biblionova.comercio.entity.EstadoPagoPedido.Pagado
          and e.fechaDespacho < :limite
        """)
    List<Long> idsRecojoVencido(@Param("limite") LocalDateTime limite);
}