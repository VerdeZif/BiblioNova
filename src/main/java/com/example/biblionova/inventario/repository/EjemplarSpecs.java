package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.dto.EjemplarFiltro;
import com.example.biblionova.inventario.entity.Ejemplar;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public final class EjemplarSpecs {
    private EjemplarSpecs() {}

    public static Specification<Ejemplar> filtrar(EjemplarFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.libroId() != null) p.add(cb.equal(root.get("libro").get("libroId"), f.libroId()));
            if (f.estado() != null) p.add(cb.equal(root.get("estado"), f.estado()));
            if (f.ubicacionId() != null) p.add(cb.equal(root.get("ubicacion").get("ubicacionId"), f.ubicacionId()));
            if (f.esVendible() != null) p.add(cb.equal(root.get("esVendible"), f.esVendible()));
            if (f.esPrestamo() != null) p.add(cb.equal(root.get("esPrestamo"), f.esPrestamo()));
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("codigoEjemplar")), like),
                        cb.like(cb.lower(root.get("libro").get("titulo")), like)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}
