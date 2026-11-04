package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.Pedido;
import com.example.biblionova.prestamos.entity.Lector;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PedidoSpecs {
    private PedidoSpecs() {}

    public static Specification<Pedido> filtrar(PedidoFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.lectorId() != null) p.add(cb.equal(root.get("lector").get("lectorId"), f.lectorId()));
            if (f.estado() != null) p.add(cb.equal(root.get("estado"), f.estado()));
            if (f.estadoPago() != null) p.add(cb.equal(root.get("estadoPago"), f.estadoPago()));
            if (f.tipoEntrega() != null) p.add(cb.equal(root.get("tipoEntrega"), f.tipoEntrega()));
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                Join<Pedido, Lector> l = root.join("lector");
                p.add(cb.or(
                        cb.like(cb.lower(root.get("numeroPedido")), like),
                        cb.like(cb.lower(l.get("documento")), like),
                        cb.like(cb.lower(l.get("nombres")), like),
                        cb.like(cb.lower(l.get("apellidos")), like)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}