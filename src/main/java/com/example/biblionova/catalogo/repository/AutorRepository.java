package com.example.biblionova.catalogo.repository;

import com.example.biblionova.catalogo.entity.Autor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AutorRepository extends JpaRepository<Autor, Integer> {
    Page<Autor> findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCase(
            String nombres, String apellidos, Pageable pageable);
}
