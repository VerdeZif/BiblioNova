package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.DetalleDevolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DetalleDevolucionRepository extends JpaRepository<DetalleDevolucion, Long> {

    // <-- ESTA ES LA LÍNEA QUE DEBES AGREGAR
    Optional<DetalleDevolucion> findByDetallePrestamo_DetallePrestamoId(Integer id);
}
