package com.example.biblionova.inventario.service;

import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.inventario.dto.UbicacionRequest;
import com.example.biblionova.inventario.dto.UbicacionResponse;
import com.example.biblionova.inventario.entity.Ubicacion;
import com.example.biblionova.inventario.repository.UbicacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UbicacionService {
    private final UbicacionRepository repo;

    @Transactional(readOnly = true)
    public List<UbicacionResponse> listar(boolean soloActivas) {
        return (soloActivas ? repo.findByActivaTrueOrderByCodigo() : repo.findAllByOrderByCodigo())
                .stream().map(this::aResponse).toList();
    }

    @Transactional
    public UbicacionResponse crear(UbicacionRequest r) {
        String codigo = r.codigo().trim().toUpperCase();
        if (repo.existsByCodigo(codigo)) throw new ConflictoException("Ya existe una ubicación con ese código");
        Ubicacion u = new Ubicacion();
        u.setCodigo(codigo);
        u.setDescripcion(r.descripcion());
        if (r.activa() != null) u.setActiva(r.activa());
        return aResponse(repo.save(u));
    }

    @Transactional
    public UbicacionResponse actualizar(Integer id, UbicacionRequest r) {
        Ubicacion u = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Ubicación", id));
        String codigo = r.codigo().trim().toUpperCase();
        if (repo.existsByCodigoAndUbicacionIdNot(codigo, id))
            throw new ConflictoException("Ya existe otra ubicación con ese código");
        u.setCodigo(codigo);
        u.setDescripcion(r.descripcion());
        if (r.activa() != null) u.setActiva(r.activa());
        return aResponse(u);
    }

    private UbicacionResponse aResponse(Ubicacion u) {
        return new UbicacionResponse(u.getUbicacionId(), u.getCodigo(), u.getDescripcion(), u.isActiva());
    }
}
