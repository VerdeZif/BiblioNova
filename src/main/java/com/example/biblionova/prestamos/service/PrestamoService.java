package com.example.biblionova.prestamos.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.Codigos;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.service.MovimientoService;
import com.example.biblionova.prestamos.dto.*;
import com.example.biblionova.prestamos.entity.*;
import com.example.biblionova.prestamos.repository.DetallePrestamoRepository;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.prestamos.repository.MultaRepository;
import com.example.biblionova.prestamos.repository.PoliticaPrestamoRepository;
import com.example.biblionova.prestamos.repository.PrestamoRepository;
import com.example.biblionova.prestamos.repository.PrestamoSpecs;
import com.example.biblionova.prestamos.repository.ReservaRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class PrestamoService {

    private static final Set<String> ORDEN_PERMITIDO = Set.of("fechaPrestamo", "fechaVencimiento", "codigoPrestamo");

    private final PrestamoRepository prestamoRepo;
    private final DetallePrestamoRepository detalleRepo;
    private final LectorRepository lectorRepo;
    private final PoliticaPrestamoRepository politicaRepo;
    private final EjemplarRepository ejemplarRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final MultaRepository multaRepo;
    private final ReservaRepository reservaRepo;
    private final ApplicationEventPublisher eventos;
    private final AuditoriaService auditoria;

    @Value("${app.prestamos.bloquear-con-multas-pendientes:true}")
    private boolean bloquearConMultas;

    @Transactional
    public PrestamoResponse crear(PrestamoRequest r) {
        Usuario usuario = usuarioActual.obtener();

        Lector lector = lectorRepo.bloquearPorId(r.lectorId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector", r.lectorId()));
        if (!lector.isActivo()) throw new ConflictoException("El lector está inactivo");
        if (bloquearConMultas && multaRepo.existeDeuda(lector.getLectorId()))
            throw new ConflictoException("El lector tiene multas pendientes de pago");

        PoliticaPrestamo politica = politicaRepo.findFirstByActivaTrueOrderByPoliticaIdAsc()
                .orElseThrow(() -> new ConflictoException("No hay una política de préstamo activa"));

        Set<String> codigos = r.codigosEjemplar().stream()
                .map(Codigos::normalizar).collect(Collectors.toCollection(LinkedHashSet::new));
        if (codigos.size() != r.codigosEjemplar().size())
            throw new SolicitudInvalidaException("Hay códigos de ejemplar repetidos");

        long enPoder = detalleRepo.countByPrestamo_Lector_LectorIdAndEstadoDetalle(
                lector.getLectorId(), EstadoDetallePrestamo.Prestado);
        if (enPoder + codigos.size() > politica.getMaxEjemplares())
            throw new ConflictoException("El lector ya tiene %d ejemplar(es) en su poder y el máximo es %d"
                    .formatted(enPoder, politica.getMaxEjemplares()));

        List<Ejemplar> ejemplares = ejemplarRepo.bloquearPorCodigos(codigos);
        Set<String> encontrados = ejemplares.stream()
                .map(e -> Codigos.normalizar(e.getCodigoEjemplar())).collect(Collectors.toSet());
        if (encontrados.size() != codigos.size()) {
            Set<String> faltantes = new LinkedHashSet<>(codigos);
            faltantes.removeAll(encontrados);
            throw new RecursoNoEncontradoException("Ejemplar", faltantes);
        }

        // Acepta un ejemplar Reservado solo si la reserva confirmada es de este mismo lector
        Map<Integer, Reserva> reservasAAtender = new HashMap<>();
        for (Ejemplar e : ejemplares) {
            if (e.getEstado() == EstadoEjemplar.Reservado) {
                Reserva res = reservaRepo.confirmadaDelEjemplar(e.getEjemplarId())
                        .filter(x -> x.getLector().getLectorId().equals(lector.getLectorId()))
                        .orElseThrow(() -> new ConflictoException(
                                "El ejemplar %s está reservado para otro lector".formatted(e.getCodigoEjemplar())));
                reservasAAtender.put(e.getEjemplarId(), res);
            } else if (e.getEstado() != EstadoEjemplar.Disponible) {
                throw new ConflictoException("El ejemplar %s no está disponible (estado: %s)"
                        .formatted(e.getCodigoEjemplar(), e.getEstado()));
            }
            if (!e.isEsPrestamo())
                throw new ConflictoException("El ejemplar %s no está destinado a préstamo".formatted(e.getCodigoEjemplar()));
            if (!e.getLibro().isActivo() || !e.getLibro().isPrestamoHabilitado())
                throw new ConflictoException("El libro '%s' no está habilitado para préstamo".formatted(e.getLibro().getTitulo()));
        }

        Prestamo p = new Prestamo();
        p.setCodigoPrestamo(Codigos.temporal());
        p.setLector(lector);
        p.setUsuario(usuario);
        p.setPolitica(politica);
        p.setFechaVencimiento(LocalDate.now().plusDays(politica.getDiasPrestamo()));
        p.setObservaciones(r.observaciones());
        prestamoRepo.save(p);
        p.setCodigoPrestamo(Codigos.formatear("PRE", p.getPrestamoId()));

        List<DetallePrestamo> detalles = new ArrayList<>();
        for (Ejemplar e : ejemplares) {
            DetallePrestamo d = new DetallePrestamo();
            d.setPrestamo(p);
            d.setEjemplar(e);
            detalleRepo.save(d);
            detalles.add(d);
            // la condición de salida queda en el movimiento (R05/flujo 4.4)
            movimientos.cambiarEstado(e, EstadoEjemplar.Prestado, TipoMovimiento.Prestamo, usuario,
                    "Prestamo", p.getPrestamoId().longValue(),
                    "Préstamo %s; condición de salida: %s".formatted(p.getCodigoPrestamo(), e.getCondicionFisica()));
            Reserva atendida = reservasAAtender.get(e.getEjemplarId());
            if (atendida != null) atendida.setEstado(EstadoReserva.Atendida);
        }
        return aResponse(p, detalles);
    }

    @Transactional(readOnly = true)
    public PageResponse<PrestamoResumen> buscar(PrestamoFiltro filtro, Pageable pageable) {
        LocalDate hoy = LocalDate.now();
        return PageResponse.de(prestamoRepo.findAll(PrestamoSpecs.filtrar(filtro), sanear(pageable))
                .map(p -> new PrestamoResumen(p.getPrestamoId(), p.getCodigoPrestamo(),
                        new ItemRef(p.getLector().getLectorId(), p.getLector().getNombreCompleto()),
                        p.getFechaPrestamo(), p.getFechaVencimiento(), p.getEstado(),
                        p.estaPendiente() && p.diasRetraso(hoy) > 0)));
    }

    @Transactional(readOnly = true)
    public PrestamoResponse obtener(Integer id) {
        Prestamo p = prestamoRepo.findWithDetalleByPrestamoId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Préstamo", id));
        return aResponse(p, detalleRepo.porPrestamo(id));
    }

    /** Solo un préstamo Activo sin devoluciones (por ejemplo, error al registrarlo). */
    @Transactional
    public PrestamoResponse anular(Integer id, AnularPrestamoRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Prestamo p = prestamoRepo.bloquearPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Préstamo", id));
        if (p.getEstado() != EstadoPrestamo.Activo)
            throw new ConflictoException("Solo se puede anular un préstamo Activo sin devoluciones (estado actual: %s)"
                    .formatted(p.getEstado()));

        ejemplarRepo.bloquearPorIds(detalleRepo.idsEjemplares(id));   // bloquear ANTES de leer los detalles
        List<DetallePrestamo> detalles = detalleRepo.porPrestamo(id);

        LocalDateTime ahora = LocalDateTime.now();
        for (DetallePrestamo d : detalles) {
            movimientos.cambiarEstado(d.getEjemplar(), EstadoEjemplar.Disponible, TipoMovimiento.Devolucion,
                    usuario, "Prestamo", id.longValue(), "Anulación del préstamo: " + r.motivo());
            d.setEstadoDetalle(EstadoDetallePrestamo.Devuelto);
            d.setFechaDevolucion(ahora);
            d.setObservacionDevolucion("Préstamo anulado: " + r.motivo());
        }
        detalles.stream().map(d -> d.getEjemplar().getLibro().getLibroId()).distinct()
                .forEach(libroId -> eventos.publishEvent(new EjemplarLiberadoEvent(libroId)));
        p.setEstado(EstadoPrestamo.Anulado);
        auditoria.registrar("Prestamo", id, "ANULAR", r.motivo(),
                datos("estado", EstadoPrestamo.Activo), datos("estado", EstadoPrestamo.Anulado));
        return aResponse(p, detalles);
    }

    /**
     * Consulta únicamente los préstamos del cliente autenticado.
     */
    @Transactional(readOnly = true)
    public PageResponse<PrestamoResumen> misPrestamos(Pageable pageable) {

        Usuario usuario = usuarioActual.obtener();

        Lector lector = lectorRepo
                .findByUsuario_UsuarioId(usuario.getUsuarioId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Lector del usuario",
                                usuario.getUsuarioId()
                        )
                );

        LocalDate hoy = LocalDate.now();

        return PageResponse.de(
                prestamoRepo.findByLector_LectorId(
                        lector.getLectorId(),
                        sanear(pageable)
                ).map(p -> new PrestamoResumen(
                        p.getPrestamoId(),
                        p.getCodigoPrestamo(),
                        new ItemRef(
                                p.getLector().getLectorId(),
                                p.getLector().getNombreCompleto()
                        ),
                        p.getFechaPrestamo(),
                        p.getFechaVencimiento(),
                        p.getEstado(),
                        p.estaPendiente() && p.diasRetraso(hoy) > 0
                ))
        );
    }

    /**
     * Consulta el detalle únicamente si pertenece al cliente.
     */
    @Transactional(readOnly = true)
    public PrestamoResponse obtenerMiPrestamo(Integer prestamoId) {

        Usuario usuario = usuarioActual.obtener();

        Lector lector = lectorRepo
                .findByUsuario_UsuarioId(usuario.getUsuarioId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Lector del usuario",
                                usuario.getUsuarioId()
                        )
                );

        Prestamo prestamo = prestamoRepo
                .findWithDetalleByPrestamoId(prestamoId)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Préstamo",
                                prestamoId
                        )
                );

        // Evita consultar préstamos de otros lectores.
        if (!prestamo.getLector().getLectorId()
                .equals(lector.getLectorId())) {

            throw new RecursoNoEncontradoException(
                    "Préstamo",
                    prestamoId
            );
        }

        return aResponse(
                prestamo,
                detalleRepo.porPrestamo(prestamoId)
        );
    }

    private Pageable sanear(Pageable p) {
        int size = Math.min(p.getPageSize(), 50);
        Sort sort = Sort.by(p.getSort().stream().filter(o -> ORDEN_PERMITIDO.contains(o.getProperty())).toList());
        if (sort.isUnsorted()) sort = Sort.by(Sort.Direction.DESC, "fechaPrestamo");
        return PageRequest.of(p.getPageNumber(), size, sort);
    }

    private PrestamoResponse aResponse(Prestamo p, List<DetallePrestamo> detalles) {
        LocalDate hoy = LocalDate.now();
        int retraso = p.diasRetraso(hoy);
        boolean vencido = p.estaPendiente() && retraso > 0;
        return new PrestamoResponse(p.getPrestamoId(), p.getCodigoPrestamo(),
                new ItemRef(p.getLector().getLectorId(), p.getLector().getNombreCompleto()),
                p.getPolitica().getNombre(), p.getFechaPrestamo(), p.getFechaVencimiento(), p.getEstado(),
                vencido, vencido ? retraso : 0, p.getUsuario().getNombreUsuario(), p.getObservaciones(),
                detalles.stream().map(d -> new DetallePrestamoResponse(d.getDetallePrestamoId(),
                        d.getEjemplar().getEjemplarId(), d.getEjemplar().getCodigoEjemplar(),
                        new ItemRef(d.getEjemplar().getLibro().getLibroId(), d.getEjemplar().getLibro().getTitulo()),
                        d.getEstadoDetalle(), d.getFechaDevolucion(), d.getObservacionDevolucion())).toList());
    }
}