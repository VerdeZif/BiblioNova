package com.example.biblionova;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class FlujosPrestamosTest extends PruebaIntegracionBase {

    @Test
    void unRetrasoGeneraMultaQueBloqueaNuevosPrestamosHastaPagarla() throws Exception {
        int libro = crearLibro("25.00");
        List<String> codigos = recibirEjemplares(libro, 2);
        int lector = crearLector();

        String prestamo = enviar("/api/prestamos", """
                {"lectorId":%d,"codigosEjemplar":["%s"]}
                """.formatted(lector, codigos.get(0)), 201);
        int prestamoId = JsonPath.read(prestamo, "$.prestamoId");

        // Simula que el préstamo venció hace 4 días
        jdbc.update("UPDATE prestamos SET fechaVencimiento = ? WHERE prestamoId = ?",
                LocalDate.now().minusDays(4), prestamoId);

        String devolucion = enviar("/api/prestamos/" + prestamoId + "/devoluciones", """
                {"lineas":[{"codigoEjemplar":"%s","condicionRecibida":"Bueno"}]}
                """.formatted(codigos.get(0)), 201);
        assertThat(JsonPath.<String>read(devolucion, "$.estadoPrestamo")).isEqualTo("Devuelto");
        assertThat(JsonPath.<Integer>read(devolucion, "$.lineas[0].diasRetraso")).isEqualTo(4);

        // 4 días × S/ 1.00 de la política inicial
        String multas = consultar("/api/prestamos/multas?lectorId=" + lector + "&soloConSaldo=true");
        assertThat(JsonPath.<String>read(multas, "$.contenido[0].tipoMulta")).isEqualTo("Retraso");
        assertThat(numero(multas, "$.contenido[0].monto")).isCloseTo(4.00, within(0.001));
        int multaId = JsonPath.read(multas, "$.contenido[0].multaId");

        // Con la multa pendiente no puede llevarse otro libro
        String otroPrestamo = """
                {"lectorId":%d,"codigosEjemplar":["%s"]}
                """.formatted(lector, codigos.get(1));
        enviar("/api/prestamos", otroPrestamo, 409);

        // Paga la multa completa y ya puede
        String pagada = enviar("/api/prestamos/multas/" + multaId + "/pagos",
                "{\"metodoCodigo\":\"EFECTIVO_TIENDA\",\"monto\":4.00}", 200);
        assertThat(JsonPath.<String>read(pagada, "$.multa.estado")).isEqualTo("Pagada");
        enviar("/api/prestamos", otroPrestamo, 201);
    }
}