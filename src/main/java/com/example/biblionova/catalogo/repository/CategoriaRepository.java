package com.example.biblionova.catalogo.repository;

import com.example.biblionova.catalogo.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    List<Categoria> findByActivaTrueOrderByNombre();
    List<Categoria> findAllByOrderByNombre();
    boolean existsByNombre(String nombre);
    boolean existsByNombreAndCategoriaIdNot(String nombre, Integer id);
}
