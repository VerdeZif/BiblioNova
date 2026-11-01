package com.example.biblionova.seguridad.repository;

import com.example.biblionova.seguridad.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {
    Optional<Rol> findByNombre(String nombre);
    List<Rol> findAllByOrderByNombre();
}
