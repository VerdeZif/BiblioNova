package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.PoliticaPrestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PoliticaPrestamoRepository extends JpaRepository<PoliticaPrestamo, Integer> {
    List<PoliticaPrestamo> findAllByOrderByNombre();
    Optional<PoliticaPrestamo> findFirstByActivaTrueOrderByPoliticaIdAsc();
    boolean existsByNombre(String nombre);

    @Modifying(clearAutomatically = true)
    @Query("update PoliticaPrestamo p set p.activa = false where p.politicaId <> :id")
    int desactivarOtras(@Param("id") Integer id);
}
