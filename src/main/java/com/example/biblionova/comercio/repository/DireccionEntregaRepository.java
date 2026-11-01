package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.DireccionEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DireccionEntregaRepository extends JpaRepository<DireccionEntrega, Long> {
    List<DireccionEntrega> findByLector_LectorIdOrderByPredeterminadaDescDireccionIdDesc(Integer lectorId);
    Optional<DireccionEntrega> findByDireccionIdAndLector_LectorId(Long id, Integer lectorId);
    Optional<DireccionEntrega> findFirstByLector_LectorIdOrderByDireccionIdDesc(Integer lectorId);
    long countByLector_LectorId(Integer lectorId);

    @Modifying(flushAutomatically = true)
    @Query("update DireccionEntrega d set d.predeterminada = false where d.lector.lectorId = :lectorId and d.direccionId <> :id")
    int desmarcarOtras(@Param("lectorId") Integer lectorId, @Param("id") Long id);
}