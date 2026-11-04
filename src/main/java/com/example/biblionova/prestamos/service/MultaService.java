package com.example.biblionova.prestamos.service;

import com.example.biblionova.auditoria.service.AuditoriaService;          // <-- AUDITORÍA
import com.example.biblionova.common.pago.MetodoPago;
import com.example.biblionova.common.pago.MetodoPagoRepository;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.prestamos.dto.*;
import com.example.biblionova.prestamos.entity.*;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.prestamos.repository.MultaRepository;
import com.example.biblionova.prestamos.repository.PagoMultaRepository;
import com.example.biblionova.prestamos.repository.MultaSpecs;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import com.example.biblionova.prestamos.repository.EvidenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;   // <-- AUDITORÍA

@Service
@RequiredArgsConstructor
public class MultaService {

    // Pago online (pasarela) no existe aún; contraentrega no aplica a multas
    private static final Set<String> METODOS_PERMITIDOS = Set.of("EFECTIVO_TIENDA", "TARJETA_TIENDA");
    private static final Set<String> ORDEN_PERMITIDO = Set.of("fechaGeneracion", "monto");

    private final MultaRepository multaRepo;
    private final PagoMultaRepository pagoRepo;
    private final MetodoPagoRepository metodoRepo;
    private final LectorRepository lectorRepo;
    private final EvidenciaRepository evidenciaRepo;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;                               // <-- AUDITORÍA

    /** Lo llama DevolucionService dentro de su transacción. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void generarPorDevolucion(Prestamo p, DetallePrestamo d, LocalDateTime fecha,
                                     CondicionRecibida condicion, String observaciones) {
        // Retraso: días × tarifa de la política con la que se hizo el préstamo, con tope por ejemplar si existe
        int dias = p.diasRetraso(fecha.toLocalDate());
        PoliticaPrestamo pol = p.getPolitica();
        if (dias > 0 && pol.getTarifaRetrasoDiaria().signum() > 0) {
            BigDecimal monto = pol.getTarifaRetrasoDiaria().multiply(BigDecimal.valueOf(dias));
            if (pol.getMaxMultaRetraso() != null && monto.compareTo(pol.getMaxMultaRetraso()) > 0)
                monto = pol.getMaxMultaRetraso();
            if (monto.signum() > 0) {
                crear(d, TipoMulta.Retraso, EstadoMulta.Pendiente, monto, dias, pol.getTarifaRetrasoDiaria(),
                        "Retraso de %d día(s) en el préstamo %s".formatted(dias, p.getCodigoPrestamo()));
            }
        }
        // Daño y pérdida NO se cobran solos (R07): quedan en revisión con monto 0 hasta que alguien los evalúe
        if (condicion == CondicionRecibida.Danado) {
            crear(d, TipoMulta.Danio, EstadoMulta.EnRevision, BigDecimal.ZERO.setScale(2), 0, null,
                    recortar("Daño detectado en la devolución: " + observaciones));
        } else if (condicion == CondicionRecibida.Perdido) {
            crear(d, TipoMulta.Perdida, EstadoMulta.EnRevision, BigDecimal.ZERO.setScale(2), 0, null,
                    recortar("Pérdida reportada en la devolución: " + observaciones));
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<MultaResponse> buscar(MultaFiltro f, Pageable pageable) {
        Page<Multa> page = multaRepo.findAll(MultaSpecs.filtrar(f), sanear(pageable));
        Map<Integer, BigDecimal> pagados = pagadosDe(page.getContent().stream().map(Multa::getMultaId).toList());
        return PageResponse.de(page.map(m -> aResponse(m, pagados.getOrDefault(m.getMultaId(), BigDecimal.ZERO))));
    }

    @Transactional(readOnly = true)
    public PageResponse<MultaResponse> mias(Pageable pageable) {
        Usuario u = usuarioActual.obtener();
        Lector l = lectorRepo.findByUsuario_UsuarioId(u.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario()));
        return buscar(new MultaFiltro(l.getLectorId(), null, null, null), pageable);
    }

    @Transactional(readOnly = true)
    public MultaDetalleResponse obtener(Integer id) {
        return detalle(multaRepo.findWithDetalleByMultaId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Multa", id)));
    }

    @Transactional
    public MultaDetalleResponse pagar(Integer id, PagoMultaRequest r) {
        Usuario usuario = usuarioActual.obtener();
        if (!METODOS_PERMITIDOS.contains(r.metodoCodigo()))
            throw new SolicitudInvalidaException("Las multas se pagan en tienda: " + METODOS_PERMITIDOS);
        MetodoPago metodo = metodoRepo.findByCodigoAndActivoTrue(r.metodoCodigo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Método de pago activo", r.metodoCodigo()));

        Multa m = multaRepo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Multa", id));
        if (m.getEstado() != EstadoMulta.Pendiente && m.getEstado() != EstadoMulta.Parcial)
            throw new ConflictoException("La multa está %s y no admite pagos".formatted(m.getEstado()));

        BigDecimal saldo = m.getMonto().subtract(pagadoDe(id));
        if (r.monto().compareTo(saldo) > 0)
            throw new ConflictoException("El pago (S/ %.2f) excede el saldo pendiente (S/ %.2f)".formatted(r.monto(), saldo));

        PagoMulta p = new PagoMulta();
        p.setMulta(m);
        p.setMetodoPago(metodo);
        p.setUsuario(usuario);
        p.setMontoPagado(r.monto());
        p.setReferenciaPago(r.referenciaPago());
        p.setEstado(EstadoPagoMulta.Confirmado);
        pagoRepo.save(p);

        EstadoMulta estadoAntes = m.getEstado();                            // <-- AUDITORÍA (antes del cambio)
        m.setEstado(saldo.subtract(r.monto()).signum() == 0 ? EstadoMulta.Pagada : EstadoMulta.Parcial);
        auditoria.registrar("Multa", id, "PAGAR",                           // <-- AUDITORÍA
                "Pago de S/ " + r.monto().toPlainString() + " (" + r.metodoCodigo() + ")",
                datos("estado", estadoAntes, "saldo", saldo),
                datos("estado", m.getEstado(), "saldo", saldo.subtract(r.monto())));
        return detalle(m);
    }

    /** El responsable fija el importe de un daño/pérdida (R07). */
    @Transactional
    public MultaDetalleResponse evaluar(Integer id, EvaluarMultaRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Multa m = multaRepo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Multa", id));
        if (m.getEstado() != EstadoMulta.EnRevision)
            throw new ConflictoException("Solo se evalúan multas EnRevision (estado actual: %s)".formatted(m.getEstado()));

        Map<String, Object> antes = datos("estado", m.getEstado(), "monto", m.getMonto());   // <-- AUDITORÍA

        m.setMonto(r.monto());
        m.setEstado(EstadoMulta.Pendiente);
        m.setEvaluadaPor(usuario);
        m.setFechaResolucion(LocalDateTime.now());
        m.setMotivo(recortar(m.getMotivo() + " | Evaluación: " + r.justificacion()));

        auditoria.registrar("Multa", id, "EVALUAR", r.justificacion(), antes,                // <-- AUDITORÍA
                datos("estado", m.getEstado(), "monto", m.getMonto()));
        return detalle(m);
    }

    /** Anulación justificada (excepciones). Si ya hubo pagos, requiere reembolso: fuera de alcance. */
    @Transactional
    public MultaDetalleResponse anular(Integer id, AnularMultaRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Multa m = multaRepo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Multa", id));
        if (m.getEstado() != EstadoMulta.Pendiente && m.getEstado() != EstadoMulta.EnRevision)
            throw new ConflictoException("No se puede anular una multa %s".formatted(m.getEstado()));
        if (pagoRepo.existsByMulta_MultaIdAndEstado(id, EstadoPagoMulta.Confirmado))
            throw new ConflictoException("La multa tiene pagos confirmados; anularla requiere un reembolso");

        Map<String, Object> antes = datos("estado", m.getEstado(), "monto", m.getMonto());   // <-- AUDITORÍA

        m.setEstado(EstadoMulta.Anulada);
        m.setEvaluadaPor(usuario);
        m.setFechaResolucion(LocalDateTime.now());
        m.setMotivo(recortar(m.getMotivo() + " | Anulada: " + r.motivo()));

        auditoria.registrar("Multa", id, "ANULAR", r.motivo(), antes,                        // <-- AUDITORÍA
                datos("estado", m.getEstado(), "monto", m.getMonto()));
        return detalle(m);
    }

    // ---------- internos ----------

    private void crear(DetallePrestamo d, TipoMulta tipo, EstadoMulta estado, BigDecimal monto,
                       int dias, BigDecimal tarifa, String motivo) {
        Multa m = new Multa();
        m.setDetallePrestamo(d);
        m.setTipoMulta(tipo);
        m.setEstado(estado);
        m.setMonto(monto);
        m.setDiasRetraso(dias);
        m.setTarifaAplicada(tarifa);
        m.setMotivo(motivo);
        multaRepo.save(m);
    }

    private BigDecimal pagadoDe(Integer multaId) {
        BigDecimal t = pagoRepo.totalPagado(multaId, EstadoPagoMulta.Confirmado);
        return t == null ? BigDecimal.ZERO : t;
    }

    private Map<Integer, BigDecimal> pagadosDe(Collection<Integer> ids) {
        if (ids.isEmpty()) return Map.of();
        return pagoRepo.totalesPagados(ids, EstadoPagoMulta.Confirmado).stream()
                .collect(Collectors.toMap(PagadoPorMulta::multaId, PagadoPorMulta::pagado));
    }

    private MultaDetalleResponse detalle(Multa m) {
        List<PagoMultaResponse> pagos = pagoRepo.findByMulta_MultaIdOrderByFechaPagoAsc(m.getMultaId()).stream()
                .map(p -> new PagoMultaResponse(p.getPagoMultaId(), p.getMontoPagado(), p.getMetodoPago().getNombre(),
                        p.getReferenciaPago(), p.getFechaPago(), p.getEstado(), p.getUsuario().getNombreUsuario()))
                .toList();

        long evidencias = evidenciaRepo.countByDetallePrestamo_DetallePrestamoId(
                m.getDetallePrestamo().getDetallePrestamoId());

        BigDecimal totalPagado = pagos.stream()
                .filter(p -> p.estado() == EstadoPagoMulta.Confirmado)
                .map(PagoMultaResponse::montoPagado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MultaDetalleResponse(aResponse(m, totalPagado), pagos, evidencias);
    }

    private MultaResponse aResponse(Multa m, BigDecimal pagado) {
        DetallePrestamo d = m.getDetallePrestamo();
        Prestamo p = d.getPrestamo();
        BigDecimal saldo = switch (m.getEstado()) {
            case Anulada, EnRevision -> BigDecimal.ZERO.setScale(2);
            default -> m.getMonto().subtract(pagado);
        };
        return new MultaResponse(m.getMultaId(), m.getTipoMulta(), m.getEstado(), m.getMonto(), pagado, saldo,
                m.getDiasRetraso(), m.getTarifaAplicada(), m.getMotivo(), m.getFechaGeneracion(),
                m.getFechaResolucion(), m.getEvaluadaPor() == null ? null : m.getEvaluadaPor().getNombreUsuario(),
                new ItemRef(p.getLector().getLectorId(), p.getLector().getNombreCompleto()),
                p.getPrestamoId(), p.getCodigoPrestamo(), d.getDetallePrestamoId(), d.getEjemplar().getCodigoEjemplar());
    }

    private static String recortar(String s) {
        return s.length() <= 500 ? s : s.substring(0, 497) + "...";
    }

    private Pageable sanear(Pageable p) {
        Sort sort = Sort.by(p.getSort().stream().filter(o -> ORDEN_PERMITIDO.contains(o.getProperty())).toList());
        if (sort.isUnsorted()) sort = Sort.by(Sort.Direction.DESC, "fechaGeneracion");
        return PageRequest.of(p.getPageNumber(), Math.min(p.getPageSize(), 50), sort);
    }
}