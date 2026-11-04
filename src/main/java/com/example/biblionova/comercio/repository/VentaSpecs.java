package com.example.biblionova.comercio.repository;


import com.example.biblionova.comercio.dto.VentaFiltro;
import com.example.biblionova.comercio.entity.Venta;
import com.example.biblionova.prestamos.entity.Lector;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


public final class VentaSpecs {
    private VentaSpecs() {}

    public static Specification<Venta> filtrar(VentaFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.canal() != null) p.add(cb.equal(root.get("canal"), f.canal()));
            if (f.estado() != null) p.add(cb.equal(root.get("estado"), f.estado()));
            if (f.lectorId() != null) p.add(cb.equal(root.get("lector").get("lectorId"), f.lectorId()));
            if (f.desde() != null)
                p.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fechaVenta"), f.desde().atStartOfDay()));
            if (f.hasta() != null)
                p.add(cb.lessThan(root.<LocalDateTime>get("fechaVenta"), f.hasta().plusDays(1).atStartOfDay()));
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                Join<Venta, Lector> l = root.join("lector", JoinType.LEFT);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("numeroVenta")), like),
                        cb.like(cb.lower(l.get("documento")), like),
                        cb.like(cb.lower(l.get("nombres")), like),
                        cb.like(cb.lower(l.get("apellidos")), like)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}