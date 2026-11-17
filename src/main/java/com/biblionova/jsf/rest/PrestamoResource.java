
package com.biblionova.jsf.rest;

import com.biblionova.jsf.entity.Prestamo;
import com.biblionova.jsf.repository.PrestamoRepository;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/prestamos")
@Produces(MediaType.APPLICATION_JSON)
public class PrestamoResource {

    @Inject
    private PrestamoRepository prestamoRepository;

    @GET
    public List<Map<String, Object>> listar() {

        return prestamoRepository.listar()
                .stream()
                .map(this::convertirAJson)
                .toList();
    }

    private Map<String, Object> convertirAJson(Prestamo prestamo) {

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("id", prestamo.getId());
        datos.put("fechaPrestamo",
                prestamo.getFechaPrestamo() != null
                        ? prestamo.getFechaPrestamo().toString()
                        : null);

        datos.put("fechaVencimiento",
                prestamo.getFechaVencimiento() != null
                        ? prestamo.getFechaVencimiento().toString()
                        : null);

        datos.put("fechaDevolucion",
                prestamo.getFechaDevolucion() != null
                        ? prestamo.getFechaDevolucion().toString()
                        : null);

        datos.put("estado", prestamo.getEstado());

        // Información básica del estudiante.
        Map<String, Object> estudiante = new LinkedHashMap<>();

        estudiante.put("id", prestamo.getUsuario().getId());
        estudiante.put("codigo", prestamo.getUsuario().getCodigo());
        estudiante.put("nombres", prestamo.getUsuario().getNombres());
        estudiante.put("apellidos", prestamo.getUsuario().getApellidos());

        datos.put("estudiante", estudiante);

        // Información básica del ejemplar.
        Map<String, Object> ejemplar = new LinkedHashMap<>();

        ejemplar.put("id", prestamo.getEjemplar().getId());
        ejemplar.put("codigo", prestamo.getEjemplar().getCodigo());

        ejemplar.put("libro",
                prestamo.getEjemplar().getLibro().getTitulo());

        datos.put("ejemplar", ejemplar);

        return datos;
    }
}
