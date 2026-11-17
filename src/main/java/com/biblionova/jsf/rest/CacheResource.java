package com.biblionova.jsf.rest;

import com.biblionova.jsf.entity.Libro;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.PersistenceUnit;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;

@Path("/cache")
@Produces(MediaType.APPLICATION_JSON)
public class CacheResource {

    @PersistenceContext(unitName = "BiblioNovaPU")
    private EntityManager em;

    @PersistenceUnit(unitName = "BiblioNovaPU")
    private EntityManagerFactory emf;

    @GET
    @Path("/libros/{id}")
    public Response probarCache(@PathParam("id") Long id) {

        Map<String, Object> datos = new LinkedHashMap<>();

        // Verificar si el libro ya está almacenado en caché.
        boolean estabaEnCache =
                emf.getCache().contains(Libro.class, id);

        // Consultar el libro mediante JPA.
        Libro libro = em.find(Libro.class, id);

        if (libro == null) {
            datos.put("mensaje", "Libro no encontrado.");
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(datos)
                    .build();
        }

        // Comprobar su presencia después de la consulta.
        boolean estaEnCache =
                emf.getCache().contains(Libro.class, id);

        datos.put("id", libro.getId());
        datos.put("titulo", libro.getTitulo());
        datos.put("estabaEnCache", estabaEnCache);
        datos.put("estaEnCache", estaEnCache);

        return Response.ok(datos).build();
    }


    @GET
    @Path("/estadisticas")
    public Response consultarEstadisticas() {

        SessionFactory sessionFactory =
                emf.unwrap(SessionFactory.class);

        Statistics estadisticas =
                sessionFactory.getStatistics();

        Map<String, Object> datos = new LinkedHashMap<>();

        datos.put("estadisticasHabilitadas",
                estadisticas.isStatisticsEnabled());

        datos.put("aciertosCache",
                estadisticas.getSecondLevelCacheHitCount());

        datos.put("fallosCache",
                estadisticas.getSecondLevelCacheMissCount());

        datos.put("almacenamientosCache",
                estadisticas.getSecondLevelCachePutCount());

        return Response.ok(datos).build();
    }
}
