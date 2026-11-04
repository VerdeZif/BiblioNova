package com.example.biblionova.catalogo.service;

import com.example.biblionova.catalogo.dto.CategoriaRequest;
import com.example.biblionova.catalogo.dto.CategoriaResponse;
import com.example.biblionova.catalogo.entity.Categoria;
import com.example.biblionova.catalogo.repository.CategoriaRepository;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {
    private final CategoriaRepository repo;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(boolean soloActivas) {
        return (soloActivas ? repo.findByActivaTrueOrderByNombre() : repo.findAllByOrderByNombre())
                .stream().map(this::aResponse).toList();
    }

    @Transactional
    public CategoriaResponse crear(CategoriaRequest r) {
        String nombre = r.nombre().trim();
        if (repo.existsByNombre(nombre)) throw new ConflictoException("Ya existe una categoría con ese nombre");
        Categoria c = new Categoria();
        c.setNombre(nombre);
        c.setDescripcion(r.descripcion());
        if (r.activa() != null) c.setActiva(r.activa());
        return aResponse(repo.save(c));
    }

    @Transactional
    public CategoriaResponse actualizar(Integer id, CategoriaRequest r) {
        Categoria c = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Categoría", id));
        String nombre = r.nombre().trim();
        if (repo.existsByNombreAndCategoriaIdNot(nombre, id))
            throw new ConflictoException("Ya existe otra categoría con ese nombre");
        c.setNombre(nombre);
        c.setDescripcion(r.descripcion());
        if (r.activa() != null) c.setActiva(r.activa());
        return aResponse(c);
    }

    @Transactional
    public void eliminar(Integer id) {
        Categoria c = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Categoría", id));
        repo.delete(c);
        repo.flush();   // fuerza el error de FK aquí si hay libros usando la categoría
    }

    private CategoriaResponse aResponse(Categoria c) {
        return new CategoriaResponse(c.getCategoriaId(), c.getNombre(), c.getDescripcion(), c.isActiva());
    }
}
