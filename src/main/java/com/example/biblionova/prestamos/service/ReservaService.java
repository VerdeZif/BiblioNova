package com.example.biblionova.prestamos.service;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.catalogo.entity.Libro;
import com.example.biblionova.catalogo.repository.LibroRepository;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.service.MovimientoService;
import com.example.biblionova.prestamos.dto.*;
import com.example.biblionova.prestamos.entity.*;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.prestamos.repository.MultaRepository;
import com.example.biblionova.prestamos.repository.ReservaRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import jakarta.persistence.criteria.Predicate; // <-- CORREGIDO: Import explícito del Predicate de Criteria API
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException; // <-- CORREGIDO: Import de la excepción de seguridad
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaService {

    private static final Set<EstadoReserva> ACTIVAS = EnumSet.of(EstadoReserva.Pendiente, EstadoReserva.Confirmada);

    @Value("${app.reservas.horas-retencion:48}") private int horasRetencion;
    @Value("${app.reservas.max-activas-por-lector:3}") private int maxActivas;
    @Value("${app.prestamos.bloquear-con-multas-pendientes:true}") private boolean bloquearConMultas;

    private final ReservaRepository reservaRepo;
    private final LectorRepository lectorRepo;
    private final LibroRepository libroRepo;
    private final EjemplarRepository ejemplarRepo;
    private final MultaRepository multaRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final ApplicationEventPublisher eventos;

    @Transactional
    public ReservaResponse crear(ReservaRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Integer lectorId = resolverLector(usuario, r.lectorId());

        Lector lector = lectorRepo.bloquearPorId(lectorId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector", lectorId));
        if (!lector.isActivo()) throw new ConflictoException("El lector está inactivo");

        Libro libro = libroRepo.findById(r.libroId())
                .filter(Libro::isActivo).filter(Libro::isPrestamoHabilitado)
                .orElseThrow(() -> new RecursoNoEncontradoException("Libro habilitado para préstamo", r.libroId()));

        if (reservaRepo.existsByLector_LectorIdAndLibro_LibroIdAndEstadoIn(lectorId, libro.getLibroId(), ACTIVAS))
            throw new ConflictoException("Ya existe una reserva activa de este libro para el lector");
        if (reservaRepo.countByLector_LectorIdAndEstadoIn(lectorId, ACTIVAS) >= maxActivas)
            throw new ConflictoException("El lector alcanzó el máximo de %d reservas activas".formatted(maxActivas));
        if (bloquearConMultas && multaRepo.existeDeuda(lectorId))
            throw new ConflictoException("El lector tiene multas pendientes de pago");

        Reserva res = new Reserva();
        res.setLector(lector);
        res.setLibro(libro);
        res.setObservaciones(r.observaciones());
        reservaRepo.save(res);

        asignarDisponibles(libro.getLibroId());       // si hay ejemplar libre, queda Confirmada de inmediato
        return aResponse(res);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservaResponse> buscar(ReservaFiltro f, Pageable pageable) {
        return PageResponse.de(reservaRepo.findAll(filtrar(f.lectorId(), f.libroId(), f.estado()), sanear(pageable))
                .map(this::aResponse));
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> mias() {
        Usuario u = usuarioActual.obtener();
        Lector l = lectorRepo.findByUsuario_UsuarioId(u.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario()));
        return reservaRepo.findAll(filtrar(l.getLectorId(), null, null),
                        PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "fechaSolicitud")))
                .map(this::aResponse).getContent();
    }

    @Transactional
    public ReservaResponse cancelar(Long id) {
        Usuario usuario = usuarioActual.obtener();
        Reserva r = bloquearConEjemplar(id);
        if (esCliente(usuario)) {
            Usuario dueno = r.getLector().getUsuario();
            if (dueno == null || !dueno.getUsuarioId().equals(usuario.getUsuarioId()))
                throw new RecursoNoEncontradoException("Reserva", id);
        }
        if (!ACTIVAS.contains(r.getEstado()))
            throw new ConflictoException("La reserva está %s y no se puede cancelar".formatted(r.getEstado()));
        liberar(r, usuario, EstadoReserva.Cancelada, "Reserva " + id + " cancelada");
        return aResponse(r);
    }

    /** Da los ejemplares libres de un libro a los primeros de la cola. */
    @Transactional
    public int asignarDisponibles(Integer libroId) {
        long pendientes = reservaRepo.countByLibro_LibroIdAndEstado(libroId, EstadoReserva.Pendiente);
        if (pendientes == 0) return 0;

        // orden de bloqueo: ejemplares primero, reservas después
        List<Ejemplar> libres = ejemplarRepo.disponiblesParaPrestamo(libroId,
                PageRequest.of(0, (int) Math.min(pendientes, 20)));
        if (libres.isEmpty()) return 0;
        List<Reserva> cola = reservaRepo.colaPendiente(libroId, PageRequest.of(0, libres.size()));

        Usuario sistema = usuarioActual.sistema();
        LocalDateTime vence = LocalDateTime.now().plusHours(horasRetencion);
        int n = Math.min(libres.size(), cola.size());
        for (int i = 0; i < n; i++) {
            Ejemplar e = libres.get(i);
            Reserva r = cola.get(i);
            movimientos.cambiarEstado(e, EstadoEjemplar.Reservado, TipoMovimiento.Reserva, sistema,
                    "Reserva", r.getReservaId(), "Apartado para la reserva " + r.getReservaId());
            r.setEjemplar(e);
            r.setEstado(EstadoReserva.Confirmada);
            r.setFechaExpiracion(vence);
        }
        return n;
    }

    @Transactional
    public void expirarUna(Long id) {
        Reserva r = bloquearConEjemplar(id);
        if (r.getEstado() != EstadoReserva.Confirmada || r.getFechaExpiracion() == null
                || r.getFechaExpiracion().isAfter(LocalDateTime.now())) return;   // ya atendida o renovada
        liberar(r, usuarioActual.sistema(), EstadoReserva.Vencida, "Reserva " + id + " vencida sin retirar");
    }

    @Transactional(readOnly = true)
    public List<Long> idsVencidas() { return reservaRepo.idsVencidas(LocalDateTime.now()); }

    @Transactional(readOnly = true)
    public List<Integer> libroIdsConPendientes() { return reservaRepo.libroIdsConPendientes(); }

    /** Se ejecuta DESPUÉS del commit de quien liberó el ejemplar (devolución, cancelación, anulación...). */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void alLiberarse(EjemplarLiberadoEvent ev) {
        asignarDisponibles(ev.libroId());
    }

    // ---------- internos ----------

    private Reserva bloquearConEjemplar(Long id) {
        if (!reservaRepo.existsById(id)) throw new RecursoNoEncontradoException("Reserva", id);
        Integer ejemplarId = reservaRepo.ejemplarIdDe(id).orElse(null);
        if (ejemplarId != null) ejemplarRepo.bloquearPorId(ejemplarId);        // primero el ejemplar...
        Reserva r = reservaRepo.bloquearPorId(id)                              // ...después la reserva
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva", id));
        Integer actual = r.getEjemplar() == null ? null : r.getEjemplar().getEjemplarId();
        if (!Objects.equals(ejemplarId, actual))
            throw new ConflictoException("La reserva cambió mientras se procesaba; intenta de nuevo");
        return r;
    }

    private void liberar(Reserva r, Usuario usuario, EstadoReserva nuevoEstado, String motivo) {
        Ejemplar e = r.getEjemplar();
        if (e != null) {
            if (e.getEstado() == EstadoEjemplar.Reservado) {
                movimientos.cambiarEstado(e, EstadoEjemplar.Disponible, TipoMovimiento.LiberacionReserva,
                        usuario, "Reserva", r.getReservaId(), motivo);
            } else {
                log.warn("Reserva {}: el ejemplar {} estaba {} y no Reservado; no se tocó",
                        r.getReservaId(), e.getCodigoEjemplar(), e.getEstado());
            }
        }
        r.setEstado(nuevoEstado);
        if (e != null) eventos.publishEvent(new EjemplarLiberadoEvent(r.getLibro().getLibroId()));
    }

    private Integer resolverLector(Usuario u, Integer lectorIdSolicitado) {
        if (esCliente(u)) {
            Integer propio = lectorRepo.findByUsuario_UsuarioId(u.getUsuarioId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario()))
                    .getLectorId();
            if (lectorIdSolicitado != null && !lectorIdSolicitado.equals(propio))
                throw new AccessDeniedException("No puedes reservar a nombre de otro lector");
            return propio;
        }
        if (lectorIdSolicitado == null) throw new SolicitudInvalidaException("Indica el lectorId");
        return lectorIdSolicitado;
    }

    private boolean esCliente(Usuario u) { return "Cliente".equalsIgnoreCase(u.getRol().getNombre()); }

    private Specification<Reserva> filtrar(Integer lectorId, Integer libroId, EstadoReserva estado) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (lectorId != null) p.add(cb.equal(root.get("lector").get("lectorId"), lectorId));
            if (libroId != null) p.add(cb.equal(root.get("libro").get("libroId"), libroId));
            if (estado != null) p.add(cb.equal(root.get("estado"), estado));
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    private Pageable sanear(Pageable p) {
        return PageRequest.of(p.getPageNumber(), Math.min(p.getPageSize(), 50),
                Sort.by(Sort.Direction.DESC, "fechaSolicitud"));
    }

    private ReservaResponse aResponse(Reserva r) {
        boolean muestraEjemplar = r.getEjemplar() != null
                && (r.getEstado() == EstadoReserva.Confirmada || r.getEstado() == EstadoReserva.Atendida);
        return new ReservaResponse(r.getReservaId(),
                new ItemRef(r.getLector().getLectorId(), r.getLector().getNombreCompleto()),
                new ItemRef(r.getLibro().getLibroId(), r.getLibro().getTitulo()),
                r.getEstado(), r.getFechaSolicitud(), r.getFechaExpiracion(),
                muestraEjemplar ? r.getEjemplar().getCodigoEjemplar() : null, r.getObservaciones());
    }
}