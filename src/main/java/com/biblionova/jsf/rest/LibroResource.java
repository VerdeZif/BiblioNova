package com.biblionova.jsf.rest;

import com.biblionova.jsf.entity.Libro;
import com.biblionova.jsf.repository.LibroRepository;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/libros")
@Produces(MediaType.APPLICATION_JSON)
public class LibroResource {

    @Inject
    private LibroRepository libroRepository;

    @GET
    public List<Map<String, Object>> listar() {

        return libroRepository.listar()
                .stream()
                .map(this::convertirAJson)
                .toList();
    }

    private Map<String, Object> convertirAJson(Libro libro) {

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("id", libro.getId());
        datos.put("isbn", libro.getIsbn());
        datos.put("titulo", libro.getTitulo());
        datos.put("autor", libro.getAutor());
        datos.put("editorial", libro.getEditorial());
        datos.put("categoria", libro.getCategoria());

        return datos;
    }
}
