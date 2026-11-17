package com.biblionova.jsf.rest;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.repository.EjemplarRepository;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/ejemplares")
@Produces(MediaType.APPLICATION_JSON)
public class EjemplarResource {

    @Inject
    private EjemplarRepository ejemplarRepository;

    @GET
    public List<Map<String, Object>> listar() {

        return ejemplarRepository.listar()
                .stream()
                .map(this::convertirAJson)
                .toList();
    }

    private Map<String, Object> convertirAJson(Ejemplar ejemplar) {

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("id", ejemplar.getId());
        datos.put("codigo", ejemplar.getCodigo());
        datos.put("estado", ejemplar.getEstado());
        datos.put("condicionFisica", ejemplar.getCondicionFisica());

        // Información del libro al que pertenece el ejemplar.
        Map<String, Object> libro = new LinkedHashMap<>();

        libro.put("id", ejemplar.getLibro().getId());
        libro.put("titulo", ejemplar.getLibro().getTitulo());
        libro.put("isbn", ejemplar.getLibro().getIsbn());

        datos.put("libro", libro);

        return datos;
    }
}
