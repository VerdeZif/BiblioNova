package com.example.biblionova;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class ReportesTest extends PruebaIntegracionBase {

    private String hoy() { return LocalDate.now().toString(); }

    @Test
    void unaVentaSumaAlResumenYApareceEnElCsv() throws Exception {
        String url = "/api/reportes/ventas/resumen?desde=%s&hasta=%s".formatted(hoy(), hoy());
        String antes = consultar(url);

        String codigo = recibirEjemplares(crearLibro("35.90"), 1).get(0);
        String venta = enviar("/api/ventas", """
                {"codigosEjemplar":["%s"],"metodoPagoCodigo":"EFECTIVO_TIENDA","montoRecibido":50.00}
                """.formatted(codigo), 201);
        String numeroVenta = JsonPath.read(venta, "$.numeroVenta");

        String despues = consultar(url);
        assertThat(numero(despues, "$.ventas") - numero(antes, "$.ventas")).isEqualTo(1.0);
        assertThat(numero(despues, "$.unidades") - numero(antes, "$.unidades")).isEqualTo(1.0);
        assertThat(numero(despues, "$.totalVendido") - numero(antes, "$.totalVendido"))
                .isCloseTo(35.90, within(0.001));

        String csv = consultar("/api/reportes/ventas/exportar?desde=%s&hasta=%s".formatted(hoy(), hoy()));
        assertThat(csv).contains("numeroVenta").contains(numeroVenta);
    }

    @Test
    void recibirEjemplaresAumentaElInventario() throws Exception {
        String antes = consultar("/api/reportes/inventario/resumen");
        recibirEjemplares(crearLibro("10.00"), 3);
        String despues = consultar("/api/reportes/inventario/resumen");
        assertThat(numero(despues, "$.ejemplares") - numero(antes, "$.ejemplares")).isEqualTo(3.0);
    }

    @Test
    void unPrestamoVencidoApareceEnElReporte() throws Exception {
        String codigo = recibirEjemplares(crearLibro("25.00"), 1).get(0);
        int lector = crearLector();
        String prestamo = enviar("/api/prestamos", """
                {"lectorId":%d,"codigosEjemplar":["%s"]}
                """.formatted(lector, codigo), 201);
        int prestamoId = JsonPath.read(prestamo, "$.prestamoId");
        jdbc.update("UPDATE prestamos SET fechaVencimiento = ? WHERE prestamoId = ?",
                LocalDate.now().minusDays(3), prestamoId);

        String vencidos = consultar("/api/reportes/prestamos/vencidos");
        assertThat(vencidos).contains(codigo);
    }

    @Test
    void cadaReporteSoloLoVenSusRoles() throws Exception {
        String vendedor = crearPersonal("Vendedor");
        String biblio = crearPersonal("Bibliotecario");
        Cliente cliente = crearCliente();

        consultarCon(vendedor, "/api/reportes/ventas/resumen", 200);
        consultarCon(vendedor, "/api/reportes/inventario/stock-bajo", 200);
        consultarCon(vendedor, "/api/reportes/prestamos/resumen", 403);
        consultarCon(vendedor, "/api/reportes/panel", 403);

        consultarCon(biblio, "/api/reportes/prestamos/vencidos", 200);
        consultarCon(biblio, "/api/reportes/multas/resumen", 200);
        consultarCon(biblio, "/api/reportes/ventas/resumen", 403);

        consultarCon(cliente.token(), "/api/reportes/inventario/resumen", 403);
        consultarCon(null, "/api/reportes/panel", 401);
        consultarCon(tokenAdmin, "/api/reportes/panel", 200);
    }

    @Test
    void losRangosInvalidosSeRechazan() throws Exception {
        consultarCon(tokenAdmin, "/api/reportes/ventas/resumen?desde=2026-10-31&hasta=2026-10-01", 400);
        consultarCon(tokenAdmin, "/api/reportes/ventas/resumen?desde=2020-01-01&hasta=2026-10-31", 400);
    }

    @Test
    void losFiltrosDeFechaDeVentasYAuditoriaAceptanFormatoIso() throws Exception {
        consultarCon(tokenAdmin, "/api/ventas?desde=%s&hasta=%s".formatted(hoy(), hoy()), 200);
        consultarCon(tokenAdmin, "/api/auditoria?desde=%s&hasta=%s".formatted(hoy(), hoy()), 200);
    }
}