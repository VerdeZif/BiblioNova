package com.example.biblionova.catalogo.service;

import com.example.biblionova.catalogo.dto.EditorialRequest;
import com.example.biblionova.catalogo.dto.EditorialResponse;
import com.example.biblionova.catalogo.entity.Editorial;
import com.example.biblionova.catalogo.repository.EditorialRepository;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EditorialService {
    private final EditorialRepository repo;

    @Transactional(readOnly = true)
    public List<EditorialResponse> listar() {
        return repo.findAllByOrderByNombre().stream().map(this::aResponse).toList();
    }

    @Transactional
    public EditorialResponse crear(EditorialRequest r) {
        String nombre = r.nombre().trim();
        if (repo.existsByNombre(nombre)) throw new ConflictoException("Ya existe una editorial con ese nombre");
        Editorial e = new Editorial();
        e.setNombre(nombre);
        e.setPais(r.pais());
        e.setSitioWeb(r.sitioWeb());
        return aResponse(repo.save(e));
    }

    @Transactional
    public EditorialResponse actualizar(Integer id, EditorialRequest r) {
        Editorial e = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Editorial", id));
        String nombre = r.nombre().trim();
        if (repo.existsByNombreAndEditorialIdNot(nombre, id))
            throw new ConflictoException("Ya existe otra editorial con ese nombre");
        e.setNombre(nombre);
        e.setPais(r.pais());
        e.setSitioWeb(r.sitioWeb());
        return aResponse(e);
    }

    @Transactional
    public void eliminar(Integer id) {
        Editorial e = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Editorial", id));
        repo.delete(e);
        repo.flush();
    }

    private EditorialResponse aResponse(Editorial e) {
        return new EditorialResponse(e.getEditorialId(), e.getNombre(), e.getPais(), e.getSitioWeb());
    }
}