package com.example.biblionova.catalogo.service;

import com.example.biblionova.catalogo.dto.AutorRequest;
import com.example.biblionova.catalogo.dto.AutorResponse;
import com.example.biblionova.catalogo.entity.Autor;
import com.example.biblionova.catalogo.repository.AutorRepository;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AutorService {
    private final AutorRepository repo;

    @Transactional(readOnly = true)
    public PageResponse<AutorResponse> buscar(String q, Pageable pageable) {
        String query = q == null ? "" : q.trim();
        Page<Autor> page = repo.findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCase(query, query, pageable);
        return PageResponse.de(page.map(this::aResponse));
    }

    @Transactional(readOnly = true)
    public AutorResponse obtener(Integer id) {
        Autor a = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Autor", id));
        return aResponse(a);
    }

    @Transactional
    public AutorResponse crear(AutorRequest r) {
        Autor a = new Autor();
        aplicar(a, r);
        return aResponse(repo.save(a));
    }

    @Transactional
    public AutorResponse actualizar(Integer id, AutorRequest r) {
        Autor a = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Autor", id));
        aplicar(a, r);
        return aResponse(a);
    }

    @Transactional
    public void eliminar(Integer id) {
        Autor a = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Autor", id));
        repo.delete(a);
        repo.flush();
    }

    private void aplicar(Autor a, AutorRequest r) {
        a.setNombres(r.nombres().trim());
        a.setApellidos(r.apellidos() != null ? r.apellidos().trim() : null);
        a.setNacionalidad(r.nacionalidad());
        a.setFechaNacimiento(r.fechaNacimiento());
        a.setBiografia(r.biografia());
    }

    private AutorResponse aResponse(Autor a) {
        return new AutorResponse(a.getAutorId(), a.getNombres(), a.getApellidos(),
                a.getNombreCompleto(), a.getNacionalidad(), a.getFechaNacimiento(), a.getBiografia());
    }
}
