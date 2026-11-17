
package com.biblionova.jsf.bean;

import com.biblionova.jsf.service.ReporteService;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.util.ArrayList;
import java.util.List;

import com.biblionova.jsf.service.ReporteExportacionService;

import jakarta.faces.context.FacesContext;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStream;


@Named("reporteBean")
@RequestScoped
public class ReporteBean {

    @Inject
    private ReporteService reporteService;

    @Inject
    private ReporteExportacionService reporteExportacionService;

    public long getTotalLibros() {
        return reporteService.contarLibros();
    }

    public long getTotalEjemplares() {
        return reporteService.contarEjemplares();
    }

    public long getEjemplaresDisponibles() {
        return reporteService.contarEjemplaresDisponibles();
    }

    public long getUsuariosActivos() {
        return reporteService.contarUsuariosActivos();
    }

    public long getPrestamosActivos() {
        return reporteService.contarPrestamosActivos();
    }

    public long getPrestamosDevueltos() {
        return reporteService.contarPrestamosDevueltos();
    }

    // Adaptar resultados JPQL para mostrarlos en JSF.
    public List<PrestamoPorLibro> getPrestamosPorLibro() {

        List<PrestamoPorLibro> resultados = new ArrayList<>();

        for (Object[] fila : reporteService.prestamosPorLibro()) {

            String titulo = (String) fila[0];
            long cantidad = ((Number) fila[1]).longValue();

            resultados.add(
                    new PrestamoPorLibro(titulo, cantidad)
            );
        }

        return resultados;
    }

    public static class PrestamoPorLibro {

        private final String titulo;
        private final long cantidad;

        public PrestamoPorLibro(String titulo, long cantidad) {
            this.titulo = titulo;
            this.cantidad = cantidad;
        }

        public String getTitulo() {
            return titulo;
        }

        public long getCantidad() {
            return cantidad;
        }
    }


    public void descargarPdf() throws IOException {
        byte[] archivo = reporteExportacionService.generarPdf();

        descargarArchivo(
                archivo,
                "reporte_biblionova.pdf",
                "application/pdf"
        );
    }

    public void descargarExcel() throws IOException {
        byte[] archivo = reporteExportacionService.generarExcel();

        descargarArchivo(
                archivo,
                "reporte_biblionova.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
    }

    private void descargarArchivo(
            byte[] archivo,
            String nombre,
            String tipoContenido) throws IOException {

        FacesContext contexto = FacesContext.getCurrentInstance();

        HttpServletResponse respuesta =
                (HttpServletResponse) contexto
                        .getExternalContext()
                        .getResponse();

        respuesta.reset();
        respuesta.setContentType(tipoContenido);
        respuesta.setHeader(
                "Content-Disposition",
                "attachment; filename=\"" + nombre + "\""
        );
        respuesta.setContentLength(archivo.length);

        try (OutputStream salida = respuesta.getOutputStream()) {
            salida.write(archivo);
            salida.flush();
        }

        contexto.responseComplete();
    }

}
