package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.dto.MultaFiltro;
import com.example.biblionova.prestamos.entity.EstadoMulta;
import com.example.biblionova.prestamos.entity.Multa;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public final class MultaSpecs {
    private MultaSpecs() {}

    public static Specification<Multa> filtrar(MultaFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.lectorId() != null)
                p.add(cb.equal(root.get("detallePrestamo").get("prestamo").get("lector").get("lectorId"), f.lectorId()));
            if (f.estado() != null) p.add(cb.equal(root.get("estado"), f.estado()));
            if (f.tipo() != null) p.add(cb.equal(root.get("tipoMulta"), f.tipo()));
            if (Boolean.TRUE.equals(f.soloConSaldo()))
                p.add(root.get("estado").in(EstadoMulta.Pendiente, EstadoMulta.Parcial));
            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}
