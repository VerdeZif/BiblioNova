package com.biblionova.jsf.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/estado")
public class EstadoResource {
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> consultar() {
        return Map.of("aplicacion", "BiblioNova JSF", "estado", "activo");
    }
}
