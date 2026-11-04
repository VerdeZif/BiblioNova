package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.dto.PrestamoFiltro;
import com.example.biblionova.prestamos.entity.EstadoPrestamo;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.entity.Prestamo;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class PrestamoSpecs {
    private PrestamoSpecs() {}

    public static Specification<Prestamo> filtrar(PrestamoFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.lectorId() != null) p.add(cb.equal(root.get("lector").get("lectorId"), f.lectorId()));
            if (f.estado() != null) p.add(cb.equal(root.get("estado"), f.estado()));
            if (Boolean.TRUE.equals(f.soloVencidos())) {
                p.add(root.get("estado").in(EstadoPrestamo.Activo, EstadoPrestamo.Parcial));
                p.add(cb.lessThan(root.<LocalDate>get("fechaVencimiento"), LocalDate.now()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                Join<Prestamo, Lector> l = root.join("lector");
                p.add(cb.or(
                        cb.like(cb.lower(root.get("codigoPrestamo")), like),
                        cb.like(cb.lower(l.get("documento")), like),
                        cb.like(cb.lower(l.get("nombres")), like),
                        cb.like(cb.lower(l.get("apellidos")), like)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}
