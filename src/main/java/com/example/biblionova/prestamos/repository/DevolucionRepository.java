package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevolucionRepository extends JpaRepository<Devolucion, Long> {}
