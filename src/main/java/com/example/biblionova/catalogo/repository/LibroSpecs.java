package com.example.biblionova.catalogo.repository;

import com.example.biblionova.catalogo.dto.LibroFiltro;
import com.example.biblionova.catalogo.entity.Autor;
import com.example.biblionova.catalogo.entity.Libro;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class LibroSpecs {
    private LibroSpecs() {}

    public static Specification<Libro> filtrar(LibroFiltro f, boolean soloActivos) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();

            if (soloActivos) p.add(cb.isTrue(root.<Boolean>get("activo")));

            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                Join<Libro, Autor> a = root.join("autores", JoinType.LEFT);
                query.distinct(true);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("titulo")), like),
                        cb.like(cb.lower(root.get("isbn")), like),
                        cb.like(cb.lower(a.get("nombres")), like),
                        cb.like(cb.lower(cb.coalesce(a.<String>get("apellidos"), "")), like)));
            }
            if (f.autorId() != null) {
                Join<Libro, Autor> a2 = root.join("autores");
                query.distinct(true);
                p.add(cb.equal(a2.get("autorId"), f.autorId()));
            }
            if (f.categoriaId() != null) p.add(cb.equal(root.get("categoria").get("categoriaId"), f.categoriaId()));
            if (f.editorialId() != null) p.add(cb.equal(root.get("editorial").get("editorialId"), f.editorialId()));
            if (f.precioMin() != null) p.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("precioVenta"), f.precioMin()));
            if (f.precioMax() != null) p.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("precioVenta"), f.precioMax()));
            if (f.ventaHabilitada() != null) p.add(cb.equal(root.get("ventaHabilitada"), f.ventaHabilitada()));
            if (f.prestamoHabilitado() != null) p.add(cb.equal(root.get("prestamoHabilitado"), f.prestamoHabilitado()));

            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}
