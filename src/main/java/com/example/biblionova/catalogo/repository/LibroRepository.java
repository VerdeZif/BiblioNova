package com.example.biblionova.catalogo.repository;

import com.example.biblionova.catalogo.entity.Libro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface LibroRepository extends JpaRepository<Libro, Integer>, JpaSpecificationExecutor<Libro> {

    @Override
    @EntityGraph(attributePaths = {"categoria", "editorial"})
    Page<Libro> findAll(Specification<Libro> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"categoria", "editorial", "autores"})
    Optional<Libro> findWithDetalleByLibroId(Integer libroId);

    boolean existsByIsbn(String isbn);
    boolean existsByIsbnAndLibroIdNot(String isbn, Integer libroId);
}
