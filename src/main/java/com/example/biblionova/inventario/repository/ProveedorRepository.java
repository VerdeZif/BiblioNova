package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {
    List<Proveedor> findAllByOrderByRazonSocial();
    boolean existsByDocumentoFiscal(String doc);
    boolean existsByDocumentoFiscalAndProveedorIdNot(String doc, Integer id);
}
