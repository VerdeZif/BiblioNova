package com.example.biblionova.reportes.dto;

import com.example.biblionova.common.exception.SolicitudInvalidaException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public final class ReporteDtos {
    private ReporteDtos() {}

    /** Rango de fechas inclusivo en ambos extremos. Sin datos: los últimos 30 días. */
    public record Periodo(LocalDate desde, LocalDate hasta) {
        public static Periodo de(LocalDate desde, LocalDate hasta) {
            LocalDate h = hasta != null ? hasta : LocalDate.now();
            LocalDate d = desde != null ? desde : h.minusDays(29);
            if (d.isAfter(h)) throw new SolicitudInvalidaException("'desde' no puede ser posterior a 'hasta'");
            if (ChronoUnit.DAYS.between(d, h) > 366) throw new SolicitudInvalidaException("El rango máximo es de 366 días");
            return new Periodo(d, h);
        }
        public LocalDateTime inicio() { return desde.atStartOfDay(); }
        public LocalDateTime finExclusivo() { return hasta.plusDays(1).atStartOfDay(); }
    }

    public record Conteo(String clave, long cantidad) {}
    public record ValorPorClave(String clave, long cantidad, BigDecimal total) {}
    public record VentasPorDia(LocalDate fecha, long cantidad, BigDecimal total) {}

    public record ResumenVentas(LocalDate desde, LocalDate hasta, long ventas, long unidades,
                                BigDecimal totalVendido, BigDecimal mercaderia, BigDecimal ticketPromedio,
                                List<ValorPorClave> porCanal, List<ValorPorClave> porMetodoPago,
                                List<VentasPorDia> porDia) {}

    public record LibroVendido(Integer libroId, String titulo, long unidades, BigDecimal importe) {}

    public record ResumenPedidos(LocalDate desde, LocalDate hasta, long pedidos, long cancelados,
                                 BigDecimal montoSinCancelados, long pendientesDeAtencion,
                                 List<ValorPorClave> porEstado, List<ValorPorClave> porTipoEntrega) {}

    public record ResumenPrestamos(LocalDate desde, LocalDate hasta, long prestamos, long ejemplaresPrestados,
                                   long ejemplaresDevueltos, List<Conteo> porEstado,
                                   List<Conteo> devolucionesPorCondicion, long ejemplaresEnPoderDeLectores,
                                   long prestamosPendientes, long prestamosVencidos) {}

    public record PrestamoVencido(Integer prestamoId, String codigoPrestamo, Integer lectorId, String lector,
                                  String telefono, String correo, String codigoEjemplar, String libro,
                                  LocalDate fechaVencimiento, long diasRetraso) {}

    public record LibroPrestado(Integer libroId, String titulo, long prestamos) {}

    public record ResumenMultas(LocalDate desde, LocalDate hasta, List<ValorPorClave> generadasPorTipo,
                                List<ValorPorClave> cobradoPorMetodo, BigDecimal totalCobrado,
                                long multasConSaldo, BigDecimal saldoPendiente, long enRevision) {}

    public record ResumenInventario(long ejemplares, long titulosActivos, List<Conteo> porEstado,
                                    BigDecimal valorCostoEnExistencia, BigDecimal valorVentaDisponible) {}

    public record StockBajo(Integer libroId, String titulo, String isbn,
                            long disponiblesVenta, long disponiblesPrestamo) {}

    public record PanelResponse(LocalDate fecha, long ventasHoy, BigDecimal totalVentasHoy,
                                BigDecimal totalVentasMes, long pedidosPorAtender, long prestamosPendientes,
                                long prestamosVencidos, long reservasActivas, long multasConSaldo,
                                BigDecimal multasSaldoPendiente, long multasEnRevision,
                                long ejemplaresDisponibles) {}
}