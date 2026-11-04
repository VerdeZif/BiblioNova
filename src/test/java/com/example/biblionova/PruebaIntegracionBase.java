package com.example.biblionova;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class PruebaIntegracionBase {

    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;
    protected String tokenAdmin;

    protected record Cliente(String token, int lectorId) {}

    @BeforeEach
    void iniciarSesionAdmin() throws Exception {
        tokenAdmin = iniciarSesion("admin", "AdminTest123!");
    }

    // ---------------------------------------------------------------- HTTP

    protected String iniciarSesion(String usuario, String contrasena) throws Exception {
        String respuesta = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"%s\",\"contrasena\":\"%s\"}".formatted(usuario, contrasena)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    /** POST como administrador. */
    protected String enviar(String url, String json, int estado) throws Exception {
        return enviarCon(tokenAdmin, url, json, estado);
    }

    /** POST con el token indicado (null = sin sesión). */
    protected String enviarCon(String token, String url, String json, int estado) throws Exception {
        var peticion = post(url).contentType(MediaType.APPLICATION_JSON).content(json);
        if (token != null) peticion.header("Authorization", "Bearer " + token);
        return mvc.perform(peticion).andExpect(status().is(estado))
                .andReturn().getResponse().getContentAsString();
    }

    /** GET como administrador. */
    protected String consultar(String url) throws Exception {
        return consultarCon(tokenAdmin, url, 200);
    }

    protected String consultarCon(String token, String url, int estado) throws Exception {
        var peticion = get(url);
        if (token != null) peticion.header("Authorization", "Bearer " + token);
        return mvc.perform(peticion).andExpect(status().is(estado))
                .andReturn().getResponse().getContentAsString();
    }

    protected double numero(String json, String ruta) {
        return ((Number) JsonPath.read(json, ruta)).doubleValue();
    }

    protected String sufijo() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    // ---------------------------------------------------------------- datos de prueba

    /** Libro nuevo con el precio indicado (crea también su autor). */
    protected int crearLibro(String precio) throws Exception {
        String s = sufijo();
        int autorId = JsonPath.read(enviar("/api/catalogo/autores",
                "{\"nombres\":\"Autor\",\"apellidos\":\"%s\"}".formatted(s), 201), "$.autorId");
        return JsonPath.read(enviar("/api/catalogo/libros", """
                {"isbn":"T-%s","titulo":"Libro %s","precioVenta":%s,"autorIds":[%d]}
                """.formatted(s, s, precio, autorId), 201), "$.libroId");
    }

    /** Recibe ejemplares de un libro; devuelve sus códigos. */
    protected List<String> recibirEjemplares(int libroId, int cantidad) throws Exception {
        String recepcion = enviar("/api/inventario/recepciones", """
                {"tipoOrigen":"Donacion","donante":"Prueba","lineas":[{"libroId":%d,"cantidad":%d}]}
                """.formatted(libroId, cantidad), 201);
        return JsonPath.read(recepcion, "$.lineas[0].ejemplares");
    }

    protected int crearLector() throws Exception {
        return JsonPath.read(enviar("/api/prestamos/lectores",
                        "{\"documento\":\"T%s\",\"nombres\":\"Test\",\"apellidos\":\"Lector\"}".formatted(sufijo()), 201),
                "$.lectorId");
    }

    /** Registra un cliente por el endpoint público y devuelve su sesión. */
    protected Cliente crearCliente() throws Exception {
        String s = sufijo();
        String respuesta = enviarCon(null, "/api/auth/registro", """
                {"nombreUsuario":"cli%s","contrasena":"Clave12345","correo":"cli%s@test.pe",
                 "documento":"D%s","nombres":"Cliente","apellidos":"Prueba"}
                """.formatted(s, s, s), 201);
        int lectorId = JsonPath.read(respuesta, "$.lectorId");
        return new Cliente(iniciarSesion("cli" + s, "Clave12345"), lectorId);
    }

    /** Crea un usuario de personal (Vendedor, Bibliotecario...) y devuelve su token. */
    protected String crearPersonal(String rol) throws Exception {
        String s = sufijo();
        enviar("/api/seguridad/usuarios", """
                {"nombreUsuario":"per%s","nombreCompleto":"Personal Prueba","correo":"per%s@test.pe",
                 "contrasena":"Clave12345","rol":"%s"}
                """.formatted(s, s, rol), 201);
        return iniciarSesion("per" + s, "Clave12345");
    }
}