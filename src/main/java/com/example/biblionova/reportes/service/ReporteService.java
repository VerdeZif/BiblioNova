package com.example.biblionova.reportes.service;

import com.example.biblionova.reportes.dto.ReporteDtos.*;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class ReporteService {

    private static final String VENTA_EN_PERIODO =
            "v.estado = 'Completada' AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta";
    private static final int LIMITE_CSV = 20_000;
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final RowMapper<Conteo> CONTEO =
            (rs, i) -> new Conteo(rs.getString("clave"), rs.getLong("cantidad"));
    private static final RowMapper<ValorPorClave> VALOR =
            (rs, i) -> new ValorPorClave(rs.getString("clave"), rs.getLong("cantidad"), rs.getBigDecimal("total"));

    private final NamedParameterJdbcTemplate jdbc;

    public ReporteService(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    // ================================================================= VENTAS

    public ResumenVentas ventas(Periodo p) {
        MapSqlParameterSource prm = rango(p);
        long ventas = contar("SELECT COUNT(*) FROM ventas v WHERE " + VENTA_EN_PERIODO, prm);
        BigDecimal total = suma("SELECT COALESCE(SUM(v.total), 0) FROM ventas v WHERE " + VENTA_EN_PERIODO, prm);
        String lineas = " FROM detalleVentas d JOIN ventas v ON v.ventaId = d.ventaId WHERE " + VENTA_EN_PERIODO;
        long unidades = contar("SELECT COUNT(*)" + lineas, prm);
        BigDecimal mercaderia = suma("SELECT COALESCE(SUM(d.importe), 0)" + lineas, prm);
        BigDecimal ticket = ventas == 0 ? BigDecimal.ZERO.setScale(2)
                : total.divide(BigDecimal.valueOf(ventas), 2, RoundingMode.HALF_UP);

        List<ValorPorClave> porCanal = jdbc.query(
                "SELECT v.canal AS clave, COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total "
                        + "FROM ventas v WHERE " + VENTA_EN_PERIODO + " GROUP BY v.canal ORDER BY v.canal", prm, VALOR);

        // Cobros del mostrador (pagosVentas) + cobros online/contraentrega (pagosPedidos), sin duplicar (nota 5 del SQL)
        List<ValorPorClave> porMetodo = jdbc.query("""
                SELECT t.clave, SUM(t.cantidad) AS cantidad, SUM(t.total) AS total FROM (
                    SELECT mp.nombre AS clave, COUNT(*) AS cantidad, SUM(pv.monto) AS total
                    FROM pagosVentas pv
                    JOIN ventas v ON v.ventaId = pv.ventaId
                    JOIN metodosPago mp ON mp.metodoId = pv.metodoPagoId
                    WHERE pv.estado = 'Confirmado' AND %1$s
                    GROUP BY mp.nombre
                    UNION ALL
                    SELECT mp.nombre, COUNT(*), SUM(pp.monto)
                    FROM pagosPedidos pp
                    JOIN ventas v ON v.pedidoId = pp.pedidoId
                    JOIN metodosPago mp ON mp.metodoId = pp.metodoPagoId
                    WHERE pp.estado = 'Confirmado' AND %1$s
                    GROUP BY mp.nombre
                ) t GROUP BY t.clave ORDER BY t.clave
                """.formatted(VENTA_EN_PERIODO), prm, VALOR);

        List<VentasPorDia> porDia = jdbc.query(
                "SELECT DATE(v.fechaVenta) AS fecha, COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total "
                        + "FROM ventas v WHERE " + VENTA_EN_PERIODO + " GROUP BY DATE(v.fechaVenta) ORDER BY fecha",
                prm, (rs, i) -> new VentasPorDia(rs.getObject("fecha", LocalDate.class),
                        rs.getLong("cantidad"), rs.getBigDecimal("total")));

        return new ResumenVentas(p.desde(), p.hasta(), ventas, unidades, total, mercaderia, ticket,
                porCanal, porMetodo, porDia);
    }

    public List<LibroVendido> topLibrosVendidos(Periodo p, int limite) {
        return jdbc.query("""
                SELECT l.libroId, l.titulo, COUNT(d.detalleVentaId) AS unidades, COALESCE(SUM(d.importe), 0) AS importe
                FROM detalleVentas d
                JOIN ventas v ON v.ventaId = d.ventaId
                JOIN ejemplares e ON e.ejemplarId = d.ejemplarId
                JOIN libros l ON l.libroId = e.libroId
                WHERE %s
                GROUP BY l.libroId, l.titulo
                ORDER BY unidades DESC, importe DESC, l.titulo
                LIMIT :limite
                """.formatted(VENTA_EN_PERIODO), rango(p).addValue("limite", limite),
                (rs, i) -> new LibroVendido(rs.getInt("libroId"), rs.getString("titulo"),
                        rs.getLong("unidades"), rs.getBigDecimal("importe")));
    }

    /** CSV sin datos personales de clientes. Se escribe con BOM para que Excel respete las tildes. */
    public byte[] exportarVentasCsv(Periodo p) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        csv.append(fila("numeroVenta", "fecha", "canal", "estado", "atendidoPor", "pedido",
                "subtotal", "impuesto", "descuento", "total"));
        jdbc.query("""
                SELECT v.numeroVenta, v.fechaVenta, v.canal, v.estado, u.nombreUsuario AS atendidoPor,
                       o.numeroPedido, v.subtotal, v.impuesto, v.descuento, v.total
                FROM ventas v
                LEFT JOIN usuarios u ON u.usuarioId = v.usuarioId
                LEFT JOIN pedidos o ON o.pedidoId = v.pedidoId
                WHERE v.fechaVenta >= :desde AND v.fechaVenta < :hasta
                ORDER BY v.fechaVenta, v.ventaId
                LIMIT %d
                """.formatted(LIMITE_CSV), rango(p), (RowCallbackHandler) rs -> csv.append(fila(
                rs.getString("numeroVenta"),
                rs.getObject("fechaVenta", LocalDateTime.class).format(FECHA_HORA),
                rs.getString("canal"), rs.getString("estado"), rs.getString("atendidoPor"),
                rs.getString("numeroPedido"), rs.getBigDecimal("subtotal"), rs.getBigDecimal("impuesto"),
                rs.getBigDecimal("descuento"), rs.getBigDecimal("total"))));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ================================================================= PEDIDOS

    public ResumenPedidos pedidos(Periodo p) {
        MapSqlParameterSource prm = rango(p);
        String donde = " FROM pedidos o WHERE o.fechaPedido >= :desde AND o.fechaPedido < :hasta GROUP BY ";
        List<ValorPorClave> porEstado = jdbc.query(
                "SELECT o.estado AS clave, COUNT(*) AS cantidad, COALESCE(SUM(o.total), 0) AS total"
                        + donde + "o.estado ORDER BY o.estado", prm, VALOR);
        List<ValorPorClave> porTipo = jdbc.query(
                "SELECT o.tipoEntrega AS clave, COUNT(*) AS cantidad, COALESCE(SUM(o.total), 0) AS total"
                        + donde + "o.tipoEntrega ORDER BY o.tipoEntrega", prm, VALOR);

        long pedidos = porEstado.stream().mapToLong(ValorPorClave::cantidad).sum();
        long cancelados = porEstado.stream().filter(v -> "Cancelado".equals(v.clave()))
                .mapToLong(ValorPorClave::cantidad).sum();
        BigDecimal sinCancelados = porEstado.stream().filter(v -> !"Cancelado".equals(v.clave()))
                .map(ValorPorClave::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        long porAtender = contar("SELECT COUNT(*) FROM pedidos "
                + "WHERE estado IN ('Pendiente','Confirmado','Preparando','ListoRecojo')", sinParametros());

        return new ResumenPedidos(p.desde(), p.hasta(), pedidos, cancelados, sinCancelados, porAtender,
                porEstado, porTipo);
    }

    // ================================================================= PRÉSTAMOS

    public ResumenPrestamos prestamos(Periodo p) {
        MapSqlParameterSource prm = rango(p).addValue("hoy", LocalDate.now());

        List<Conteo> porEstado = jdbc.query("""
                SELECT pr.estado AS clave, COUNT(*) AS cantidad FROM prestamos pr
                WHERE pr.fechaPrestamo >= :desde AND pr.fechaPrestamo < :hasta
                GROUP BY pr.estado ORDER BY pr.estado
                """, prm, CONTEO);
        long prestamos = porEstado.stream().mapToLong(Conteo::cantidad).sum();

        long ejemplaresPrestados = contar("""
                SELECT COUNT(*) FROM detallePrestamos d JOIN prestamos pr ON pr.prestamoId = d.prestamoId
                WHERE pr.estado <> 'Anulado' AND pr.fechaPrestamo >= :desde AND pr.fechaPrestamo < :hasta
                """, prm);

        List<Conteo> devoluciones = jdbc.query("""
                SELECT dd.condicionRecibida AS clave, COUNT(*) AS cantidad
                FROM detalleDevoluciones dd JOIN devoluciones dv ON dv.devolucionId = dd.devolucionId
                WHERE dv.fechaDevolucion >= :desde AND dv.fechaDevolucion < :hasta
                GROUP BY dd.condicionRecibida ORDER BY dd.condicionRecibida
                """, prm, CONTEO);
        long devueltos = devoluciones.stream().mapToLong(Conteo::cantidad).sum();

        // Estas tres son fotografías de hoy, no dependen del rango
        long enPoder = contar("SELECT COUNT(*) FROM detallePrestamos WHERE estadoDetalle = 'Prestado'", prm);
        long pendientes = contar("SELECT COUNT(*) FROM prestamos WHERE estado IN ('Activo','Parcial')", prm);
        long vencidos = contar("SELECT COUNT(*) FROM prestamos WHERE estado IN ('Activo','Parcial') "
                + "AND fechaVencimiento < :hoy", prm);

        return new ResumenPrestamos(p.desde(), p.hasta(), prestamos, ejemplaresPrestados, devueltos,
                porEstado, devoluciones, enPoder, pendientes, vencidos);
    }

    /** Ejemplares que siguen en poder del lector pasada la fecha de vencimiento (hoy). */
    public List<PrestamoVencido> prestamosVencidos() {
        return jdbc.query("""
                SELECT pr.prestamoId, pr.codigoPrestamo, lc.lectorId,
                       CONCAT(lc.nombres, ' ', lc.apellidos) AS lector, lc.telefono, lc.correo,
                       e.codigoEjemplar, l.titulo, pr.fechaVencimiento,
                       DATEDIFF(:hoy, pr.fechaVencimiento) AS diasRetraso
                FROM detallePrestamos d
                JOIN prestamos pr ON pr.prestamoId = d.prestamoId
                JOIN lectores lc ON lc.lectorId = pr.lectorId
                JOIN ejemplares e ON e.ejemplarId = d.ejemplarId
                JOIN libros l ON l.libroId = e.libroId
                WHERE d.estadoDetalle = 'Prestado' AND pr.estado IN ('Activo','Parcial')
                  AND pr.fechaVencimiento < :hoy
                ORDER BY diasRetraso DESC, pr.prestamoId
                LIMIT 500
                """, new MapSqlParameterSource().addValue("hoy", LocalDate.now()),
                (rs, i) -> new PrestamoVencido(rs.getInt("prestamoId"), rs.getString("codigoPrestamo"),
                        rs.getInt("lectorId"), rs.getString("lector"), rs.getString("telefono"),
                        rs.getString("correo"), rs.getString("codigoEjemplar"), rs.getString("titulo"),
                        rs.getObject("fechaVencimiento", LocalDate.class), rs.getLong("diasRetraso")));
    }

    public List<LibroPrestado> topLibrosPrestados(Periodo p, int limite) {
        return jdbc.query("""
                SELECT l.libroId, l.titulo, COUNT(d.detallePrestamoId) AS prestamos
                FROM detallePrestamos d
                JOIN prestamos pr ON pr.prestamoId = d.prestamoId
                JOIN ejemplares e ON e.ejemplarId = d.ejemplarId
                JOIN libros l ON l.libroId = e.libroId
                WHERE pr.estado <> 'Anulado' AND pr.fechaPrestamo >= :desde AND pr.fechaPrestamo < :hasta
                GROUP BY l.libroId, l.titulo
                ORDER BY prestamos DESC, l.titulo
                LIMIT :limite
                """, rango(p).addValue("limite", limite),
                (rs, i) -> new LibroPrestado(rs.getInt("libroId"), rs.getString("titulo"), rs.getLong("prestamos")));
    }

    // ================================================================= MULTAS

    public ResumenMultas multas(Periodo p) {
        MapSqlParameterSource prm = rango(p);
        List<ValorPorClave> generadas = jdbc.query("""
                SELECT m.tipoMulta AS clave, COUNT(*) AS cantidad, COALESCE(SUM(m.monto), 0) AS total
                FROM multas m
                WHERE m.estado <> 'Anulada' AND m.fechaGeneracion >= :desde AND m.fechaGeneracion < :hasta
                GROUP BY m.tipoMulta ORDER BY m.tipoMulta
                """, prm, VALOR);
        List<ValorPorClave> cobrado = jdbc.query("""
                SELECT mp.nombre AS clave, COUNT(*) AS cantidad, COALESCE(SUM(pm.montoPagado), 0) AS total
                FROM pagosMultas pm JOIN metodosPago mp ON mp.metodoId = pm.metodoPagoId
                WHERE pm.estado = 'Confirmado' AND pm.fechaPago >= :desde AND pm.fechaPago < :hasta
                GROUP BY mp.nombre ORDER BY mp.nombre
                """, prm, VALOR);
        BigDecimal totalCobrado = cobrado.stream().map(ValorPorClave::total).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ResumenMultas(p.desde(), p.hasta(), generadas, cobrado, totalCobrado,
                multasConSaldo(), saldoMultas(), multasEnRevision());
    }

    // ================================================================= INVENTARIO

    public ResumenInventario inventario() {
        MapSqlParameterSource sin = sinParametros();
        List<Conteo> porEstado = jdbc.query(
                "SELECT e.estado AS clave, COUNT(*) AS cantidad FROM ejemplares e GROUP BY e.estado ORDER BY e.estado",
                sin, CONTEO);
        long total = porEstado.stream().mapToLong(Conteo::cantidad).sum();
        long titulos = contar("SELECT COUNT(*) FROM libros WHERE activo = 1", sin);
        // Las donaciones no tienen costo: el valor a costo es un mínimo, no el valor real
        BigDecimal costo = suma("SELECT COALESCE(SUM(e.costoAdquisicion), 0) FROM ejemplares e "
                + "WHERE e.estado NOT IN ('Vendido','Baja','Perdido')", sin);
        BigDecimal venta = suma("SELECT COALESCE(SUM(l.precioVenta), 0) FROM ejemplares e "
                + "JOIN libros l ON l.libroId = e.libroId WHERE e.estado = 'Disponible' AND e.esVendible = 1", sin);
        return new ResumenInventario(total, titulos, porEstado, costo, venta);
    }

    public List<StockBajo> stockBajo(int umbral, int limite) {
        return jdbc.query("""
                SELECT l.libroId, l.titulo, l.isbn,
                       COUNT(CASE WHEN e.estado = 'Disponible' AND e.esVendible = 1 THEN 1 END) AS disponiblesVenta,
                       COUNT(CASE WHEN e.estado = 'Disponible' AND e.esPrestamo = 1 THEN 1 END) AS disponiblesPrestamo
                FROM libros l LEFT JOIN ejemplares e ON e.libroId = l.libroId
                WHERE l.activo = 1 AND l.ventaHabilitada = 1
                GROUP BY l.libroId, l.titulo, l.isbn
                HAVING COUNT(CASE WHEN e.estado = 'Disponible' AND e.esVendible = 1 THEN 1 END) <= :umbral
                ORDER BY disponiblesVenta, l.titulo
                LIMIT :limite
                """, new MapSqlParameterSource().addValue("umbral", umbral).addValue("limite", limite),
                (rs, i) -> new StockBajo(rs.getInt("libroId"), rs.getString("titulo"), rs.getString("isbn"),
                        rs.getLong("disponiblesVenta"), rs.getLong("disponiblesPrestamo")));
    }

    // ================================================================= PANEL

    public PanelResponse panel() {
        LocalDate hoy = LocalDate.now();
        MapSqlParameterSource prm = new MapSqlParameterSource()
                .addValue("inicio", hoy.atStartOfDay())
                .addValue("fin", hoy.plusDays(1).atStartOfDay())
                .addValue("mes", hoy.withDayOfMonth(1).atStartOfDay())
                .addValue("hoy", hoy);
        MapSqlParameterSource sin = sinParametros();

        return new PanelResponse(hoy,
                contar("SELECT COUNT(*) FROM ventas WHERE estado = 'Completada' "
                        + "AND fechaVenta >= :inicio AND fechaVenta < :fin", prm),
                suma("SELECT COALESCE(SUM(total), 0) FROM ventas WHERE estado = 'Completada' "
                        + "AND fechaVenta >= :inicio AND fechaVenta < :fin", prm),
                suma("SELECT COALESCE(SUM(total), 0) FROM ventas WHERE estado = 'Completada' "
                        + "AND fechaVenta >= :mes AND fechaVenta < :fin", prm),
                contar("SELECT COUNT(*) FROM pedidos WHERE estado IN ('Pendiente','Confirmado','Preparando','ListoRecojo')", sin),
                contar("SELECT COUNT(*) FROM prestamos WHERE estado IN ('Activo','Parcial')", sin),
                contar("SELECT COUNT(*) FROM prestamos WHERE estado IN ('Activo','Parcial') AND fechaVencimiento < :hoy", prm),
                contar("SELECT COUNT(*) FROM reservas WHERE estado IN ('Pendiente','Confirmada')", sin),
                multasConSaldo(), saldoMultas(), multasEnRevision(),
                contar("SELECT COUNT(*) FROM ejemplares WHERE estado = 'Disponible'", sin));
    }

    // ================================================================= internos

    private long multasConSaldo() {
        return contar("SELECT COUNT(*) FROM multas WHERE estado IN ('Pendiente','Parcial')", sinParametros());
    }

    private long multasEnRevision() {
        return contar("SELECT COUNT(*) FROM multas WHERE estado = 'EnRevision'", sinParametros());
    }

    /** Lo que se debe hoy: monto de las multas abiertas menos lo ya cobrado de ellas. */
    private BigDecimal saldoMultas() {
        BigDecimal monto = suma("SELECT COALESCE(SUM(m.monto), 0) FROM multas m "
                + "WHERE m.estado IN ('Pendiente','Parcial')", sinParametros());
        BigDecimal pagado = suma("SELECT COALESCE(SUM(pm.montoPagado), 0) FROM pagosMultas pm "
                + "JOIN multas m ON m.multaId = pm.multaId "
                + "WHERE pm.estado = 'Confirmado' AND m.estado IN ('Pendiente','Parcial')", sinParametros());
        return monto.subtract(pagado);
    }

    private MapSqlParameterSource rango(Periodo p) {
        return new MapSqlParameterSource().addValue("desde", p.inicio()).addValue("hasta", p.finExclusivo());
    }

    private MapSqlParameterSource sinParametros() {
        return new MapSqlParameterSource();
    }

    private long contar(String sql, SqlParameterSource prm) {
        return Objects.requireNonNullElse(jdbc.queryForObject(sql, prm, Long.class), 0L);
    }

    private BigDecimal suma(String sql, SqlParameterSource prm) {
        return Objects.requireNonNullElse(jdbc.queryForObject(sql, prm, BigDecimal.class), BigDecimal.ZERO);
    }

    private static String fila(Object... celdas) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < celdas.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(celda(celdas[i]));
        }
        return sb.append("\r\n").toString();
    }

    /** Escapa comillas y comas, y neutraliza las "fórmulas" que Excel ejecutaría (=, +, -, @). */
    private static String celda(Object valor) {
        if (valor == null) return "";
        String s = valor instanceof BigDecimal b ? b.toPlainString() : valor.toString();
        if (!s.isEmpty() && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r"))
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}