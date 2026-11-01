package com.example.biblionova.reportes.controller;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.config.GestionInventario;
import com.example.biblionova.config.GestionPedidos;
import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.reportes.dto.ReporteDtos.*;
import com.example.biblionova.reportes.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService service;
    private final AuditoriaService auditoria;

    @GetMapping("/panel") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public PanelResponse panel() { return service.panel(); }

    // ---------------------------------------------------------------- ventas y pedidos (Administrador, Vendedor)

    @GetMapping("/ventas/resumen") @GestionPedidos
    public ResumenVentas ventas(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.ventas(Periodo.de(desde, hasta));
    }

    @GetMapping("/ventas/top-libros") @GestionPedidos
    public List<LibroVendido> topVendidos(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                          @RequestParam(defaultValue = "10") int limite) {
        return service.topLibrosVendidos(Periodo.de(desde, hasta), Math.max(1, Math.min(limite, 50)));
    }

    @GetMapping("/ventas/exportar") @GestionPedidos
    public ResponseEntity<byte[]> exportarVentas(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        Periodo p = Periodo.de(desde, hasta);
        byte[] csv = service.exportarVentasCsv(p);
        auditoria.registrar("Reporte", "ventas", "EXPORTAR_CSV",
                "Exportación de ventas del %s al %s".formatted(p.desde(), p.hasta()), null, null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("ventas_%s_%s.csv".formatted(p.desde(), p.hasta())).build().toString())
                .body(csv);
    }

    @GetMapping("/pedidos/resumen") @GestionPedidos
    public ResumenPedidos pedidos(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.pedidos(Periodo.de(desde, hasta));
    }

    // ---------------------------------------------------------------- préstamos y multas (Administrador, Bibliotecario)

    @GetMapping("/prestamos/resumen") @GestionPrestamos
    public ResumenPrestamos prestamos(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.prestamos(Periodo.de(desde, hasta));
    }

    @GetMapping("/prestamos/vencidos") @GestionPrestamos
    public List<PrestamoVencido> vencidos() { return service.prestamosVencidos(); }

    @GetMapping("/prestamos/top-libros") @GestionPrestamos
    public List<LibroPrestado> topPrestados(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                            @RequestParam(defaultValue = "10") int limite) {
        return service.topLibrosPrestados(Periodo.de(desde, hasta), Math.max(1, Math.min(limite, 50)));
    }

    @GetMapping("/multas/resumen") @GestionPrestamos
    public ResumenMultas multas(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.multas(Periodo.de(desde, hasta));
    }

    // ---------------------------------------------------------------- inventario

    @GetMapping("/inventario/resumen") @GestionInventario
    public ResumenInventario inventario() { return service.inventario(); }

    @GetMapping("/inventario/stock-bajo") @PreAuthorize("hasAnyRole('ADMINISTRADOR','BIBLIOTECARIO','VENDEDOR')")
    public List<StockBajo> stockBajo(@RequestParam(defaultValue = "2") int umbral,
                                     @RequestParam(defaultValue = "50") int limite) {
        return service.stockBajo(Math.max(0, Math.min(umbral, 1000)), Math.max(1, Math.min(limite, 200)));
    }
}