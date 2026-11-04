package com.example.biblionova;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FlujosIntegracionTest {

    @Autowired MockMvc mvc;
    private String token;

    @BeforeEach
    void iniciarSesion() throws Exception {
        String respuesta = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"admin\",\"contrasena\":\"AdminTest123!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(respuesta, "$.token");
    }

    // ---------------------------------------------------------------- pruebas

    @Test
    void sinTokenNoSePuedeVender() throws Exception {
        mvc.perform(post("/api/ventas").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void dosLectoresNoPuedenLlevarseElMismoEjemplarALaVez() throws Exception {
        String codigo = prepararEjemplares(1).get(0);
        int lectorA = crearLector();
        int lectorB = crearLector();

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch salida = new CountDownLatch(1);          // los dos hilos arrancan juntos
        List<Future<Integer>> resultados = new ArrayList<>();
        for (int lector : new int[]{lectorA, lectorB}) {
            resultados.add(pool.submit(() -> {
                salida.await();
                return mvc.perform(post("/api/prestamos")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"lectorId\":%d,\"codigosEjemplar\":[\"%s\"]}".formatted(lector, codigo)))
                        .andReturn().getResponse().getStatus();
            }));
        }
        salida.countDown();
        List<Integer> estados = new ArrayList<>();
        for (Future<Integer> f : resultados) estados.add(f.get(30, TimeUnit.SECONDS));
        pool.shutdown();

        assertThat(estados).containsExactlyInAnyOrder(201, 409);   // uno gana, el otro recibe conflicto

        String ejemplar = consultar("/api/inventario/ejemplares?q=" + codigo);
        assertThat(JsonPath.<String>read(ejemplar, "$.contenido[0].estado")).isEqualTo("Prestado");
    }

    @Test
    void unaVentaConEfectivoInsuficienteNoDejaNadaRegistrado() throws Exception {
        String codigo = prepararEjemplares(1).get(0);

        // Efectivo menor al total (35.90): se rechaza y el ejemplar sigue Disponible
        enviar("/api/ventas", """
                {"codigosEjemplar":["%s"],"metodoPagoCodigo":"EFECTIVO_TIENDA","montoRecibido":10.00}
                """.formatted(codigo), 400);
        String antes = consultar("/api/inventario/ejemplares?q=" + codigo);
        assertThat(JsonPath.<String>read(antes, "$.contenido[0].estado")).isEqualTo("Disponible");

        // Con efectivo suficiente se completa y calcula el vuelto
        String venta = enviar("/api/ventas", """
                {"codigosEjemplar":["%s"],"metodoPagoCodigo":"EFECTIVO_TIENDA","montoRecibido":50.00}
                """.formatted(codigo), 201);
        assertThat(JsonPath.<String>read(venta, "$.estado")).isEqualTo("Completada");
        double vuelto = ((Number) JsonPath.read(venta, "$.vuelto")).doubleValue();
        assertThat(vuelto).isCloseTo(14.10, within(0.001));

        String despues = consultar("/api/inventario/ejemplares?q=" + codigo);
        assertThat(JsonPath.<String>read(despues, "$.contenido[0].estado")).isEqualTo("Vendido");

        // El mismo ejemplar no se puede vender dos veces
        enviar("/api/ventas", """
                {"codigosEjemplar":["%s"],"metodoPagoCodigo":"EFECTIVO_TIENDA","montoRecibido":50.00}
                """.formatted(codigo), 409);
    }

    // ---------------------------------------------------------------- ayudas

    /** Crea autor, libro y una recepción; devuelve los códigos de los ejemplares generados. */
    private List<String> prepararEjemplares(int cantidad) throws Exception {
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        int autorId = JsonPath.read(enviar("/api/catalogo/autores",
                "{\"nombres\":\"Autor\",\"apellidos\":\"" + sufijo + "\"}", 201), "$.autorId");
        int libroId = JsonPath.read(enviar("/api/catalogo/libros", """
                {"isbn":"T-%s","titulo":"Libro %s","precioVenta":35.90,"autorIds":[%d]}
                """.formatted(sufijo, sufijo, autorId), 201), "$.libroId");
        String recepcion = enviar("/api/inventario/recepciones", """
                {"tipoOrigen":"Donacion","donante":"Prueba","lineas":[{"libroId":%d,"cantidad":%d}]}
                """.formatted(libroId, cantidad), 201);
        return JsonPath.read(recepcion, "$.lineas[0].ejemplares");
    }

    private int crearLector() throws Exception {
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        return JsonPath.read(enviar("/api/prestamos/lectores",
                        "{\"documento\":\"T%s\",\"nombres\":\"Test\",\"apellidos\":\"Lector\"}".formatted(sufijo), 201),
                "$.lectorId");
    }

    private String enviar(String url, String json, int estadoEsperado) throws Exception {
        return mvc.perform(post(url)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().is(estadoEsperado))
                .andReturn().getResponse().getContentAsString();
    }

    private String consultar(String url) throws Exception {
        return mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }
}