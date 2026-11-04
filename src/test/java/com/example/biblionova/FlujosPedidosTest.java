package com.example.biblionova;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class FlujosPedidosTest extends PruebaIntegracionBase {

    private int crearDireccion(Cliente c) throws Exception {
        return JsonPath.read(enviarCon(c.token(), "/api/pedidos/direcciones", """
                {"destinatario":"Cliente Prueba","telefono":"999888777",
                 "distrito":"Independencia","direccion":"Av. Prueba 123"}
                """, 201), "$.direccionId");
    }

    private int stockVenta(int libroId) throws Exception {
        return JsonPath.read(consultarCon(null, "/api/catalogo/libros/" + libroId, 200),
                "$.stock.disponiblesVenta");
    }

    @Test
    void elPedidoDeEjemploDelDocumentoSumaNoventaYDosConCuarenta() throws Exception {
        int libroA = crearLibro("35.90");
        int libroB = crearLibro("48.50");
        recibirEjemplares(libroA, 1);
        recibirEjemplares(libroB, 1);
        Cliente c = crearCliente();
        int direccionId = crearDireccion(c);

        String cuerpo = """
                {"tipoEntrega":"Delivery","direccionId":%d,"metodoPagoCodigo":"CONTRAENTREGA",
                 "lineas":[{"libroId":%d,"cantidad":1},{"libroId":%d,"cantidad":1}]}
                """.formatted(direccionId, libroA, libroB);
        String pedido = enviarCon(c.token(), "/api/pedidos", cuerpo, 201);

        assertThat(numero(pedido, "$.subtotal")).isCloseTo(84.40, within(0.001));
        assertThat(numero(pedido, "$.costoEnvio")).isCloseTo(8.00, within(0.001));
        assertThat(numero(pedido, "$.total")).isCloseTo(92.40, within(0.001));
        assertThat(JsonPath.<String>read(pedido, "$.estado")).isEqualTo("Pendiente");
        assertThat(stockVenta(libroA)).isZero();
        assertThat(stockVenta(libroB)).isZero();

        // Sin stock, el mismo pedido ya no se puede repetir
        enviarCon(c.token(), "/api/pedidos", cuerpo, 409);
    }

    @Test
    void cancelarUnPedidoSinPagarDevuelveElStock() throws Exception {
        int libro = crearLibro("20.00");
        recibirEjemplares(libro, 1);
        Cliente c = crearCliente();

        String pedido = enviarCon(c.token(), "/api/pedidos", """
                {"tipoEntrega":"Recojo","metodoPagoCodigo":"EFECTIVO_TIENDA",
                 "lineas":[{"libroId":%d,"cantidad":1}]}
                """.formatted(libro), 201);
        int pedidoId = JsonPath.read(pedido, "$.pedidoId");
        assertThat(stockVenta(libro)).isZero();

        String cancelado = enviarCon(c.token(), "/api/pedidos/" + pedidoId + "/cancelar",
                "{\"motivo\":\"Ya no lo necesito\"}", 200);
        assertThat(JsonPath.<String>read(cancelado, "$.estado")).isEqualTo("Cancelado");
        assertThat(stockVenta(libro)).isEqualTo(1);
    }

    @Test
    void pagoOnlineSimuladoPermiteRechazoReintentoYAprobacion() throws Exception {
        int libro = crearLibro("30.00");
        recibirEjemplares(libro, 1);
        Cliente c = crearCliente();

        String pedido = enviarCon(c.token(), "/api/pedidos", """
                {"tipoEntrega":"Recojo","metodoPagoCodigo":"PAGO_ONLINE",
                 "lineas":[{"libroId":%d,"cantidad":1}]}
                """.formatted(libro), 201);
        int id = JsonPath.read(pedido, "$.pedidoId");
        int pago1 = JsonPath.read(pedido, "$.pagos[0].pagoPedidoId");

        // Un pago online no se confirma a mano
        enviar("/api/pedidos/" + id + "/confirmar", "{}", 409);

        String rechazado = enviarCon(c.token(),
                "/api/pedidos/%d/pagos/%d/pago-simulado".formatted(id, pago1),
                "{\"resultado\":\"RECHAZADO\"}", 200);
        assertThat(JsonPath.<String>read(rechazado, "$.estadoPago")).isEqualTo("Fallido");

        String reintento = enviarCon(c.token(), "/api/pedidos/" + id + "/pagos/reintentar", "{}", 200);
        int pago2 = JsonPath.read(reintento, "$.pagos[1].pagoPedidoId");

        String aprobado = enviarCon(c.token(),
                "/api/pedidos/%d/pagos/%d/pago-simulado".formatted(id, pago2),
                "{\"resultado\":\"APROBADO\"}", 200);
        assertThat(JsonPath.<String>read(aprobado, "$.estadoPago")).isEqualTo("Pagado");
        assertThat(JsonPath.<String>read(aprobado, "$.estado")).isEqualTo("Confirmado");
        assertThat(JsonPath.<String>read(aprobado, "$.pagos[1].referenciaExterna")).startsWith("SIM-");

        // Con el pago confirmado ya no se puede cancelar (no hay reembolsos)
        enviarCon(c.token(), "/api/pedidos/" + id + "/cancelar", "{\"motivo\":\"Prueba\"}", 409);
    }
}