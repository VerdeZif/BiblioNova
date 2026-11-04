package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.entity.DetalleRecepcion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DetalleRecepcionRepository extends JpaRepository<DetalleRecepcion, Long> {
    @EntityGraph(attributePaths = "libro")
    List<DetalleRecepcion> findByRecepcion_RecepcionId(Long recepcionId);
}
