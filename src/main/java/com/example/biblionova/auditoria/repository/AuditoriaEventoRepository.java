package com.example.biblionova.auditoria.repository;

import com.example.biblionova.auditoria.entity.AuditoriaEvento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface AuditoriaEventoRepository
        extends JpaRepository<AuditoriaEvento, Long>, JpaSpecificationExecutor<AuditoriaEvento> {

    @Override
    @EntityGraph(attributePaths = "usuario")
    Page<AuditoriaEvento> findAll(Specification<AuditoriaEvento> spec, Pageable pageable);

    @EntityGraph(attributePaths = "usuario")
    Optional<AuditoriaEvento> findWithUsuarioByEventoId(Long id);
}