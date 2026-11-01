package com.example.biblionova.prestamos.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.common.almacenamiento.AlmacenArchivos;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.prestamos.dto.ArchivoEvidencia;
import com.example.biblionova.prestamos.dto.EvidenciaResponse;
import com.example.biblionova.prestamos.entity.DetalleDevolucion;
import com.example.biblionova.prestamos.entity.DetallePrestamo;
import com.example.biblionova.prestamos.entity.Evidencia;
import com.example.biblionova.prestamos.entity.TipoEvidencia;
import com.example.biblionova.prestamos.repository.DetalleDevolucionRepository;
import com.example.biblionova.prestamos.repository.DetallePrestamoRepository;
import com.example.biblionova.prestamos.repository.EvidenciaRepository;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@Slf4j
public class EvidenciaService {

    private final AlmacenArchivos almacen;
    private final EvidenciaRepository repo;
    private final EjemplarRepository ejemplarRepo;
    private final DetallePrestamoRepository detalleRepo;
    private final DetalleDevolucionRepository devolucionDetalleRepo;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;
    private final int diasRetencion;

    public EvidenciaService(AlmacenArchivos almacen, EvidenciaRepository repo, EjemplarRepository ejemplarRepo,
                            DetallePrestamoRepository detalleRepo, DetalleDevolucionRepository devolucionDetalleRepo,
                            UsuarioActual usuarioActual, AuditoriaService auditoria,
                            @Value("${app.evidencias.dias-retencion:365}") int diasRetencion) {
        this.almacen = almacen;
        this.repo = repo;
        this.ejemplarRepo = ejemplarRepo;
        this.detalleRepo = detalleRepo;
        this.devolucionDetalleRepo = devolucionDetalleRepo;
        this.usuarioActual = usuarioActual;
        this.auditoria = auditoria;
        this.diasRetencion = diasRetencion;
    }

    @Transactional
    public EvidenciaResponse subir(Integer ejemplarId, TipoEvidencia tipo, Integer detallePrestamoId,
                                   String descripcion, MultipartFile archivo) throws IOException {
        if (archivo == null || archivo.isEmpty()) throw new SolicitudInvalidaException("Falta el archivo");
        if (descripcion != null && descripcion.length() > 500)
            throw new SolicitudInvalidaException("La descripción no puede superar 500 caracteres");

        Ejemplar ejemplar = ejemplarRepo.findById(ejemplarId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ejemplar", ejemplarId));

        if ((tipo == TipoEvidencia.Entrega || tipo == TipoEvidencia.Devolucion) && detallePrestamoId == null)
            throw new SolicitudInvalidaException("Una evidencia de " + tipo + " requiere detallePrestamoId");

        DetallePrestamo detalle = null;
        DetalleDevolucion detalleDev = null;
        if (detallePrestamoId != null) {
            detalle = detalleRepo.findById(detallePrestamoId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Detalle de préstamo", detallePrestamoId));
            if (!detalle.getEjemplar().getEjemplarId().equals(ejemplarId))
                throw new SolicitudInvalidaException("Ese detalle de préstamo no corresponde a ese ejemplar");
            if (tipo == TipoEvidencia.Devolucion) {
                detalleDev = devolucionDetalleRepo.findByDetallePrestamo_DetallePrestamoId(detallePrestamoId)
                        .orElseThrow(() -> new ConflictoException("Ese ejemplar aún no se registró como devuelto"));
            }
        }

        byte[] cabecera;
        try (InputStream in = archivo.getInputStream()) { cabecera = in.readNBytes(12); }
        String extension = extensionSegura(cabecera);
        if (extension == null) throw new SolicitudInvalidaException("Solo se aceptan imágenes JPG, PNG o WEBP");

        LocalDate hoy = LocalDate.now();
        String clave = "evidencias/%d/%02d/%s.%s".formatted(hoy.getYear(), hoy.getMonthValue(), UUID.randomUUID(), extension);

        try (InputStream in = archivo.getInputStream()) {
            almacen.guardar(clave, in, archivo.getSize(), tipoMime(extension).toString());
        }

        try {
            Evidencia ev = new Evidencia();
            ev.setEjemplar(ejemplar);
            ev.setDetallePrestamo(detalle);
            ev.setDetalleDevolucion(detalleDev);
            ev.setUsuario(usuarioActual.obtener());
            ev.setTipoEvidencia(tipo);
            ev.setRutaArchivo(clave);
            ev.setDescripcion(descripcion);
            repo.saveAndFlush(ev);
            return aResponse(ev);
        } catch (RuntimeException e) {
            try { almacen.eliminar(clave); } catch (RuntimeException ignorado) { /* ya falló la base: no tapar el error */ }
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<EvidenciaResponse> listar(Integer ejemplarId) {
        return repo.findByEjemplar_EjemplarIdOrderByFechaRegistroDesc(ejemplarId).stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public ArchivoEvidencia archivo(Long id) {
        Evidencia ev = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Evidencia", id));
        String clave = ev.getRutaArchivo();
        String ext = clave.substring(clave.lastIndexOf('.') + 1);
        return new ArchivoEvidencia(almacen.cargar(clave), tipoMime(ext));
    }

    /** Política de conservación (R11): borra fotos viejas cuya multa ya no está abierta. */
    @Transactional
    public int limpiarVencidas() {
        LocalDateTime limite = LocalDateTime.now().minusDays(diasRetencion);
        List<Evidencia> lote = repo.vencidas(limite, PageRequest.of(0, 100));
        int eliminadas = 0;
        for (Evidencia e : lote) {
            try {
                almacen.eliminar(e.getRutaArchivo());
                repo.delete(e);
                eliminadas++;
            } catch (RuntimeException ex) {
                log.warn("No se pudo eliminar la evidencia {}: {}", e.getEvidenciaId(), ex.getMessage());
            }
        }
        if (eliminadas > 0)
            auditoria.registrar("Evidencia", null, "LIMPIEZA_RETENCION",
                    "Evidencias eliminadas por la política de conservación: " + eliminadas,
                    null, datos("cantidad", eliminadas, "diasRetencion", diasRetencion));
        return eliminadas;
    }

    private MediaType tipoMime(String ext) {
        return switch (ext) {
            case "png" -> MediaType.IMAGE_PNG;
            case "webp" -> MediaType.parseMediaType("image/webp");
            default -> MediaType.IMAGE_JPEG;
        };
    }

    private String extensionSegura(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return "png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        return null;
    }

    private EvidenciaResponse aResponse(Evidencia e) {
        return new EvidenciaResponse(e.getEvidenciaId(), e.getEjemplar().getEjemplarId(),
                e.getDetallePrestamo() == null ? null : e.getDetallePrestamo().getDetallePrestamoId(),
                e.getTipoEvidencia(), e.getDescripcion(), e.getFechaRegistro(), e.getUsuario().getNombreUsuario());
    }
}