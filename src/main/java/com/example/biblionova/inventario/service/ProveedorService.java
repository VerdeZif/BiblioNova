package com.example.biblionova.inventario.service;

import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.inventario.dto.ProveedorRequest;
import com.example.biblionova.inventario.dto.ProveedorResponse;
import com.example.biblionova.inventario.entity.Proveedor;
import com.example.biblionova.inventario.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorService {
    private final ProveedorRepository repo;

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listar() {
        return repo.findAllByOrderByRazonSocial().stream().map(this::aResponse).toList();
    }

    @Transactional
    public ProveedorResponse crear(ProveedorRequest r) {
        String doc = normalizar(r.documentoFiscal());
        if (doc != null && repo.existsByDocumentoFiscal(doc))
            throw new ConflictoException("Ya existe un proveedor con ese documento fiscal");
        Proveedor p = new Proveedor();
        copiar(p, r, doc);
        return aResponse(repo.save(p));
    }

    @Transactional
    public ProveedorResponse actualizar(Integer id, ProveedorRequest r) {
        Proveedor p = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Proveedor", id));
        String doc = normalizar(r.documentoFiscal());
        if (doc != null && repo.existsByDocumentoFiscalAndProveedorIdNot(doc, id))
            throw new ConflictoException("Ya existe otro proveedor con ese documento fiscal");
        copiar(p, r, doc);
        return aResponse(p);
    }

    private String normalizar(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    private void copiar(Proveedor p, ProveedorRequest r, String doc) {
        p.setRazonSocial(r.razonSocial().trim());
        p.setDocumentoFiscal(doc);
        p.setContacto(r.contacto());
        p.setCorreo(r.correo());
        p.setTelefono(r.telefono());
        p.setDireccion(r.direccion());
        if (r.activo() != null) p.setActivo(r.activo());
    }

    private ProveedorResponse aResponse(Proveedor p) {
        return new ProveedorResponse(p.getProveedorId(), p.getRazonSocial(), p.getDocumentoFiscal(),
                p.getContacto(), p.getCorreo(), p.getTelefono(), p.getDireccion(), p.isActivo());
    }
}
