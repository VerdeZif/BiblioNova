package com.example.biblionova.catalogo.repository;

import com.example.biblionova.catalogo.entity.Editorial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EditorialRepository extends JpaRepository<Editorial, Integer> {
    List<Editorial> findAllByOrderByNombre();
    boolean existsByNombre(String nombre);
    boolean existsByNombreAndEditorialIdNot(String nombre, Integer id);
}
