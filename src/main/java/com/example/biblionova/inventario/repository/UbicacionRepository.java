package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.entity.Ubicacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UbicacionRepository extends JpaRepository<Ubicacion, Integer> {
    List<Ubicacion> findAllByOrderByCodigo();
    List<Ubicacion> findByActivaTrueOrderByCodigo();
    boolean existsByCodigo(String codigo);
    boolean existsByCodigoAndUbicacionIdNot(String codigo, Integer id);
}
