
package com.biblionova.jsf.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@ApplicationScoped
public class ReporteExportacionService {

    @Inject
    private ReporteService reporteService;

    private static final String LOGO =
            "/resources/img/logo-universidad-xyz.png";

    private static final Color GRANATE =
            new Color(105, 9, 31);

    private static final Color GRANATE_OSCURO =
            new Color(73, 9, 23);

    private static final Color DORADO =
            new Color(201, 155, 41);

    private static final Color DORADO_SUAVE =
            new Color(244, 232, 197);

    private static final Color MARFIL =
            new Color(248, 245, 241);

    private static final Color TEXTO =
            new Color(38, 35, 41);

    private static final Color GRIS =
            new Color(105, 99, 106);

    private static final PDType1Font PDF_NORMAL =
            new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA
            );

    private static final PDType1Font PDF_NEGRITA =
            new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA_BOLD
            );

    private String fechaActual() {
        return LocalDate.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );
    }

    private byte[] obtenerLogo() throws IOException {

        FacesContext contexto =
                FacesContext.getCurrentInstance();

        if (contexto == null) {
            throw new IOException(
                    "No se encontro el contexto JSF."
            );
        }

        try (InputStream entrada =
                     contexto.getExternalContext()
                             .getResourceAsStream(LOGO)) {

            if (entrada == null) {
                throw new IOException(
                        "No se encontro el logo: " + LOGO
                );
            }

            return entrada.readAllBytes();
        }
    }

    // ==========================================
    // EXPORTACION PDF
    // ==========================================

    public byte[] generarPdf() throws IOException {

        try (PDDocument documento = new PDDocument();
             ByteArrayOutputStream salida =
                     new ByteArrayOutputStream()) {

            List<Object[]> libros =
                    reporteService.prestamosPorLibro();

            PDImageXObject logo =
                    PDImageXObject.createFromByteArray(
                            documento,
                            obtenerLogo(),
                            "logo-universidad-xyz"
                    );

            int indice = 0;
            int numeroPagina = 1;

            do {
                PDPage pagina =
                        new PDPage(PDRectangle.A4);

                documento.addPage(pagina);

                try (PDPageContentStream cs =
                             new PDPageContentStream(
                                     documento, pagina
                             )) {

                    dibujarEncabezadoPdf(cs, logo);

                    float y;

                    if (numeroPagina == 1) {
                        dibujarResumenPdf(cs);
                        y = 390;
                    } else {
                        escribirPdf(
                                cs,
                                "CONTINUACION DEL REPORTE",
                                45, 680, 12,
                                true, GRANATE
                        );
                        y = 645;
                    }

                    escribirPdf(
                            cs,
                            "LIBROS MAS PRESTADOS",
                            45, y + 15, 13,
                            true, GRANATE
                    );

                    y -= 12;

                    dibujarRectangulo(
                            cs,
                            45, y - 30,
                            505, 30,
                            GRANATE
                    );

                    escribirPdf(
                            cs,
                            "TITULO DEL LIBRO",
                            58, y - 20, 9,
                            true, Color.WHITE
                    );

                    escribirPdf(
                            cs,
                            "PRESTAMOS",
                            460, y - 20, 9,
                            true, Color.WHITE
                    );

                    y -= 30;

                    if (libros.isEmpty()) {
                        escribirPdf(
                                cs,
                                "No hay prestamos registrados.",
                                58, y - 24, 10,
                                false, GRIS
                        );
                    }

                    int filaPagina = 0;

                    while (indice < libros.size() && y > 100) {

                        Object[] fila = libros.get(indice);

                        if (filaPagina % 2 == 0) {
                            dibujarRectangulo(
                                    cs,
                                    45, y - 28,
                                    505, 28,
                                    MARFIL
                            );
                        }

                        String titulo = ajustarTituloPdf(
                                String.valueOf(fila[0]),
                                380,
                                9
                        );

                        escribirPdf(
                                cs,
                                titulo,
                                58, y - 19, 9,
                                false, TEXTO
                        );

                        escribirPdf(
                                cs,
                                String.valueOf(fila[1]),
                                480, y - 19, 9,
                                true, GRANATE
                        );

                        indice++;
                        filaPagina++;
                        y -= 28;
                    }

                    dibujarPiePdf(cs, numeroPagina);
                }

                numeroPagina++;

            } while (indice < libros.size());

            documento.save(salida);
            return salida.toByteArray();
        }
    }

    private void dibujarEncabezadoPdf(
            PDPageContentStream cs,
            PDImageXObject logo) throws IOException {

        dibujarRectangulo(
                cs, 0, 746, 595, 96, GRANATE_OSCURO
        );

        dibujarRectangulo(
                cs, 0, 742, 595, 4, DORADO
        );

        escribirPdf(
                cs,
                "UNIVERSIDAD TECNOLOGICA XYZ",
                45, 801, 16,
                true, Color.WHITE
        );

        escribirPdf(
                cs,
                "SISTEMA DE GESTION BIBLIOTECARIA",
                45, 778, 10,
                false, Color.WHITE
        );

        dibujarRectangulo(
                cs, 475, 754, 88, 82, Color.WHITE
        );

        float escala = Math.min(
                74f / logo.getWidth(),
                70f / logo.getHeight()
        );

        float ancho = logo.getWidth() * escala;
        float alto = logo.getHeight() * escala;

        cs.drawImage(
                logo,
                482 + (74 - ancho) / 2,
                760 + (70 - alto) / 2,
                ancho,
                alto
        );

        escribirPdf(
                cs,
                "REPORTE GENERAL DE GESTION",
                45, 713, 17,
                true, GRANATE
        );

        escribirPdf(
                cs,
                "Fecha de emision: " + fechaActual(),
                45, 694, 9,
                false, GRIS
        );

        dibujarRectangulo(
                cs, 45, 681, 505, 1, DORADO
        );
    }

    private void dibujarResumenPdf(
            PDPageContentStream cs) throws IOException {

        escribirPdf(
                cs,
                "RESUMEN ESTADISTICO",
                45, 653, 13,
                true, GRANATE
        );

        dibujarTarjetaPdf(
                cs, 45, 559,
                "LIBROS",
                reporteService.contarLibros()
        );

        dibujarTarjetaPdf(
                cs, 218, 559,
                "EJEMPLARES",
                reporteService.contarEjemplares()
        );

        dibujarTarjetaPdf(
                cs, 391, 559,
                "DISPONIBLES",
                reporteService.contarEjemplaresDisponibles()
        );

        dibujarTarjetaPdf(
                cs, 45, 475,
                "USUARIOS ACTIVOS",
                reporteService.contarUsuariosActivos()
        );

        dibujarTarjetaPdf(
                cs, 218, 475,
                "PRESTAMOS ACTIVOS",
                reporteService.contarPrestamosActivos()
        );

        dibujarTarjetaPdf(
                cs, 391, 475,
                "DEVOLUCIONES",
                reporteService.contarPrestamosDevueltos()
        );
    }

    private void dibujarTarjetaPdf(
            PDPageContentStream cs,
            float x,
            float y,
            String titulo,
            long valor) throws IOException {

        dibujarRectangulo(
                cs, x, y, 159, 70, MARFIL
        );

        dibujarRectangulo(
                cs, x, y, 4, 70, DORADO
        );

        escribirPdf(
                cs, titulo,
                x + 14, y + 47, 9,
                true, GRANATE
        );

        escribirPdf(
                cs, String.valueOf(valor),
                x + 14, y + 14, 24,
                true, GRANATE
        );
    }

    private void dibujarPiePdf(
            PDPageContentStream cs,
            int pagina) throws IOException {

        dibujarRectangulo(
                cs, 45, 53, 505, 2, DORADO
        );

        escribirPdf(
                cs,
                "Biblioteca de la Universidad Tecnologica XYZ",
                45, 36, 8,
                false, GRANATE
        );

        escribirPdf(
                cs,
                "Pagina " + pagina,
                490, 36, 8,
                false, GRANATE
        );
    }

    private void dibujarRectangulo(
            PDPageContentStream cs,
            float x,
            float y,
            float ancho,
            float alto,
            Color color) throws IOException {

        cs.setNonStrokingColor(color);
        cs.addRect(x, y, ancho, alto);
        cs.fill();
    }

    private void escribirPdf(
            PDPageContentStream cs,
            String texto,
            float x,
            float y,
            int tamano,
            boolean negrita,
            Color color) throws IOException {

        cs.beginText();
        cs.setNonStrokingColor(color);

        cs.setFont(
                negrita ? PDF_NEGRITA : PDF_NORMAL,
                tamano
        );

        cs.newLineAtOffset(x, y);
        cs.showText(limpiarTextoPdf(texto));
        cs.endText();
    }

    private String ajustarTituloPdf(
            String texto,
            float anchoMaximo,
            int tamano) throws IOException {

        String original = limpiarTextoPdf(texto);
        String resultado = original;

        while (!resultado.isEmpty()) {

            float ancho =
                    PDF_NORMAL.getStringWidth(resultado)
                            / 1000f * tamano;

            if (ancho <= anchoMaximo) {
                break;
            }

            resultado = resultado.substring(
                    0, resultado.length() - 1
            );
        }

        if (resultado.length() < original.length()) {

            while (!resultado.isEmpty()
                    && PDF_NORMAL.getStringWidth(
                    resultado + "..."
            ) / 1000f * tamano > anchoMaximo) {

                resultado = resultado.substring(
                        0, resultado.length() - 1
                );
            }

            resultado += "...";
        }

        return resultado;
    }

    private String limpiarTextoPdf(String texto) {

        String valor = texto == null ? "" : texto;

        String normalizado = Normalizer.normalize(
                valor,
                Normalizer.Form.NFD
        );

        return normalizado
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\x20-\\x7E]", "");
    }

    // ==========================================
    // EXPORTACION EXCEL
    // ==========================================

    public byte[] generarExcel() throws IOException {

        try (XSSFWorkbook libro = new XSSFWorkbook();
             ByteArrayOutputStream salida =
                     new ByteArrayOutputStream()) {

            byte[] logo = obtenerLogo();

            EstilosExcel estilos = new EstilosExcel(libro);

            // HOJA 1: RESUMEN
            XSSFSheet resumen =
                    libro.createSheet("Resumen");

            prepararHojaExcel(
                    libro,
                    resumen,
                    estilos,
                    logo,
                    "RESUMEN GENERAL"
            );

            crearEncabezadoTabla(
                    resumen,
                    estilos,
                    "INDICADOR",
                    "CANTIDAD"
            );

            String[] indicadores = {
                    "Libros registrados",
                    "Ejemplares físicos",
                    "Ejemplares disponibles",
                    "Usuarios activos",
                    "Préstamos activos",
                    "Préstamos devueltos"
            };

            long[] cantidades = {
                    reporteService.contarLibros(),
                    reporteService.contarEjemplares(),
                    reporteService.contarEjemplaresDisponibles(),
                    reporteService.contarUsuariosActivos(),
                    reporteService.contarPrestamosActivos(),
                    reporteService.contarPrestamosDevueltos()
            };

            for (int i = 0; i < indicadores.length; i++) {

                agregarFilaExcel(
                        resumen,
                        estilos,
                        i + 6,
                        indicadores[i],
                        cantidades[i],
                        i
                );
            }

            resumen.setAutoFilter(
                    new CellRangeAddress(
                            5, 11, 1, 2
                    )
            );

            resumen.createFreezePane(0, 6);

            // HOJA 2: PRESTAMOS POR LIBRO
            XSSFSheet prestamos =
                    libro.createSheet("Prestamos por libro");

            prepararHojaExcel(
                    libro,
                    prestamos,
                    estilos,
                    logo,
                    "PRÉSTAMOS POR LIBRO"
            );

            crearEncabezadoTabla(
                    prestamos,
                    estilos,
                    "TÍTULO DEL LIBRO",
                    "TOTAL DE PRÉSTAMOS"
            );

            List<Object[]> datos =
                    reporteService.prestamosPorLibro();

            if (datos.isEmpty()) {

                Row fila = prestamos.createRow(6);
                fila.setHeightInPoints(31);

                crearCeldaTexto(
                        fila,
                        1,
                        "No hay préstamos registrados.",
                        estilos.normal
                );

                crearCeldaTexto(
                        fila,
                        2,
                        "",
                        estilos.numero
                );

            } else {

                for (int i = 0; i < datos.size(); i++) {

                    Object[] dato = datos.get(i);

                    agregarFilaExcel(
                            prestamos,
                            estilos,
                            i + 6,
                            String.valueOf(dato[0]),
                            ((Number) dato[1]).longValue(),
                            i
                    );
                }
            }

            prestamos.setAutoFilter(
                    new CellRangeAddress(
                            5,
                            Math.max(6, 5 + datos.size()),
                            1,
                            2
                    )
            );

            prestamos.createFreezePane(0, 6);

            libro.write(salida);

            return salida.toByteArray();
        }
    }

    // ==========================================
    // DISEÑO DE CADA HOJA
    // ==========================================

    private void prepararHojaExcel(
            XSSFWorkbook libro,
            XSSFSheet hoja,
            EstilosExcel estilos,
            byte[] logo,
            String nombreReporte) {

        hoja.setDisplayGridlines(false);
        hoja.setPrintGridlines(false);
        hoja.setZoom(100);

        // A: margen izquierdo
        hoja.setColumnWidth(0, 4 * 256);

        // B: textos y nombres de libros
        hoja.setColumnWidth(1, 68 * 256);

        // C: cantidades y logo
        hoja.setColumnWidth(2, 24 * 256);

        // D: margen derecho
        hoja.setColumnWidth(3, 4 * 256);

        Row fila0 = hoja.createRow(0);
        fila0.setHeightInPoints(40);

        crearCeldaTexto(
                fila0,
                1,
                "UNIVERSIDAD TECNOLÓGICA XYZ",
                estilos.titulo
        );

        crearCeldaTexto(
                fila0,
                2,
                "",
                estilos.fondoLogo
        );

        Row fila1 = hoja.createRow(1);
        fila1.setHeightInPoints(29);

        crearCeldaTexto(
                fila1,
                1,
                "SISTEMA DE GESTIÓN BIBLIOTECARIA",
                estilos.subtitulo
        );

        crearCeldaTexto(
                fila1,
                2,
                "",
                estilos.fondoLogo
        );

        Row fila2 = hoja.createRow(2);
        fila2.setHeightInPoints(29);

        crearCeldaTexto(
                fila2,
                1,
                nombreReporte,
                estilos.subtitulo
        );

        crearCeldaTexto(
                fila2,
                2,
                "",
                estilos.fondoLogo
        );

        Row fila3 = hoja.createRow(3);
        fila3.setHeightInPoints(29);

        crearCeldaTexto(
                fila3,
                1,
                "Fecha de emisión: " + fechaActual(),
                estilos.fecha
        );

        crearCeldaTexto(
                fila3,
                2,
                "",
                estilos.fondoLogo
        );

        Row fila4 = hoja.createRow(4);
        fila4.setHeightInPoints(8);

        crearCeldaTexto(
                fila4,
                1,
                "",
                estilos.dorado
        );

        crearCeldaTexto(
                fila4,
                2,
                "",
                estilos.dorado
        );

        insertarLogoExcel(libro, hoja, logo);

        // Formato de impresión
        hoja.setFitToPage(true);
        hoja.setHorizontallyCenter(true);

        PrintSetup impresion =
                hoja.getPrintSetup();

        impresion.setPaperSize(
                PrintSetup.A4_PAPERSIZE
        );

        impresion.setLandscape(false);
        impresion.setFitWidth((short) 1);
        impresion.setFitHeight((short) 0);

        hoja.setMargin(Sheet.LeftMargin, 0.35);
        hoja.setMargin(Sheet.RightMargin, 0.35);
        hoja.setMargin(Sheet.TopMargin, 0.4);
        hoja.setMargin(Sheet.BottomMargin, 0.4);

        // CORRECCION:
        // Apache POI utiliza setCenter y setRight.
        Footer pie = hoja.getFooter();

        pie.setCenter(
                "Universidad Tecnológica XYZ - Biblioteca"
        );

        pie.setRight(
                "Página &P de &N"
        );
    }

    // ==========================================
    // LOGO DE EXCEL
    // ==========================================

    private void insertarLogoExcel(
            XSSFWorkbook libro,
            XSSFSheet hoja,
            byte[] logo) {

        int indiceLogo = libro.addPicture(
                logo,
                Workbook.PICTURE_TYPE_PNG
        );

        XSSFDrawing dibujo =
                hoja.createDrawingPatriarch();

        XSSFClientAnchor ancla =
                new XSSFClientAnchor();

        // Columna C, filas 1 a 4.
        ancla.setCol1(2);
        ancla.setRow1(0);
        ancla.setCol2(3);
        ancla.setRow2(4);

        ancla.setAnchorType(
                ClientAnchor.AnchorType.MOVE_AND_RESIZE
        );

        dibujo.createPicture(
                ancla,
                indiceLogo
        );
    }

    // ==========================================
    // ENCABEZADOS DE TABLA
    // ==========================================

    private void crearEncabezadoTabla(
            XSSFSheet hoja,
            EstilosExcel estilos,
            String titulo1,
            String titulo2) {

        Row fila = hoja.createRow(5);
        fila.setHeightInPoints(34);

        crearCeldaTexto(
                fila,
                1,
                titulo1,
                estilos.cabecera
        );

        crearCeldaTexto(
                fila,
                2,
                titulo2,
                estilos.cabecera
        );
    }

    private void agregarFilaExcel(
            XSSFSheet hoja,
            EstilosExcel estilos,
            int indiceFila,
            String nombre,
            long cantidad,
            int indice) {

        Row fila = hoja.createRow(indiceFila);
        fila.setHeightInPoints(31);

        crearCeldaTexto(
                fila,
                1,
                nombre,
                indice % 2 == 0
                        ? estilos.normal
                        : estilos.alterno
        );

        Cell numero = fila.createCell(2);
        numero.setCellValue(cantidad);
        numero.setCellStyle(estilos.numero);
    }

    private void crearCeldaTexto(
            Row fila,
            int columna,
            String valor,
            CellStyle estilo) {

        Cell celda = fila.createCell(columna);
        celda.setCellValue(valor);
        celda.setCellStyle(estilo);
    }

    // ==========================================
    // ESTILOS DE EXCEL
    // ==========================================

    private static class EstilosExcel {

        final XSSFCellStyle titulo;
        final XSSFCellStyle subtitulo;
        final XSSFCellStyle fecha;
        final XSSFCellStyle fondoLogo;
        final XSSFCellStyle dorado;
        final XSSFCellStyle cabecera;
        final XSSFCellStyle normal;
        final XSSFCellStyle alterno;
        final XSSFCellStyle numero;

        EstilosExcel(XSSFWorkbook libro) {

            titulo = crearEstilo(
                    libro,
                    GRANATE_OSCURO,
                    Color.WHITE,
                    true,
                    17,
                    HorizontalAlignment.LEFT
            );

            subtitulo = crearEstilo(
                    libro,
                    GRANATE_OSCURO,
                    Color.WHITE,
                    true,
                    11,
                    HorizontalAlignment.LEFT
            );

            fecha = crearEstilo(
                    libro,
                    GRANATE_OSCURO,
                    DORADO_SUAVE,
                    false,
                    11,
                    HorizontalAlignment.LEFT
            );

            fondoLogo = crearEstilo(
                    libro,
                    Color.WHITE,
                    GRANATE,
                    false,
                    11,
                    HorizontalAlignment.CENTER
            );

            dorado = crearEstilo(
                    libro,
                    DORADO,
                    DORADO,
                    false,
                    10,
                    HorizontalAlignment.LEFT
            );

            cabecera = crearEstilo(
                    libro,
                    GRANATE,
                    Color.WHITE,
                    true,
                    12,
                    HorizontalAlignment.LEFT
            );

            normal = crearEstilo(
                    libro,
                    Color.WHITE,
                    TEXTO,
                    false,
                    11,
                    HorizontalAlignment.LEFT
            );

            alterno = crearEstilo(
                    libro,
                    MARFIL,
                    TEXTO,
                    false,
                    11,
                    HorizontalAlignment.LEFT
            );

            numero = crearEstilo(
                    libro,
                    DORADO_SUAVE,
                    GRANATE,
                    true,
                    12,
                    HorizontalAlignment.RIGHT
            );
        }

        private static XSSFCellStyle crearEstilo(
                XSSFWorkbook libro,
                Color fondo,
                Color texto,
                boolean negrita,
                int tamano,
                HorizontalAlignment alineacion) {

            XSSFCellStyle estilo =
                    libro.createCellStyle();

            DefaultIndexedColorMap mapa =
                    new DefaultIndexedColorMap();

            estilo.setFillForegroundColor(
                    new XSSFColor(fondo, mapa)
            );

            estilo.setFillPattern(
                    FillPatternType.SOLID_FOREGROUND
            );

            estilo.setAlignment(alineacion);

            estilo.setVerticalAlignment(
                    VerticalAlignment.CENTER
            );

            estilo.setWrapText(false);

            XSSFFont fuente =
                    libro.createFont();

            fuente.setFontName("Aptos");

            fuente.setFontHeightInPoints(
                    (short) tamano
            );

            fuente.setBold(negrita);

            fuente.setColor(
                    new XSSFColor(texto, mapa)
            );

            estilo.setFont(fuente);

            return estilo;
        }
    }
}
