package com.example.biblionova.prestamos.service;

import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.Codigos;
import com.example.biblionova.inventario.entity.CondicionFisica;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.service.MovimientoService;
import com.example.biblionova.prestamos.dto.DevolucionRequest;
import com.example.biblionova.prestamos.dto.DevolucionResponse;
import com.example.biblionova.prestamos.dto.EjemplarLiberadoEvent;
import com.example.biblionova.prestamos.dto.LineaDevolucionRequest;
import com.example.biblionova.prestamos.dto.LineaDevolucionResponse;
import com.example.biblionova.prestamos.entity.*;
import com.example.biblionova.prestamos.repository.DetalleDevolucionRepository;
import com.example.biblionova.prestamos.repository.DetallePrestamoRepository;
import com.example.biblionova.prestamos.repository.DevolucionRepository;
import com.example.biblionova.prestamos.repository.PrestamoRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DevolucionService {


    private final PrestamoRepository prestamoRepo;
    private final DetallePrestamoRepository detalleRepo;
    private final DevolucionRepository devolucionRepo;
    private final DetalleDevolucionRepository detalleDevolucionRepo;
    private final EjemplarRepository ejemplarRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final MultaService multas; // <-- Inyectado
    private final ApplicationEventPublisher eventos; // <-- Inyectado

    @Transactional
    public DevolucionResponse registrar(Integer prestamoId, DevolucionRequest r) {

        // DIAGNÓSTICO 1: comprobar si la solicitud llega al servicio
        System.out.println("========== INICIO DEVOLUCION ==========");
        System.out.println("Prestamo ID: " + prestamoId);
        System.out.println(
                "Longitud de observaciones generales: " +
                        (r.observaciones() == null ? 0 : r.observaciones().length())
        );

        Usuario usuario = usuarioActual.obtener();

        System.out.println("DIAGNÓSTICO 2: Usuario autenticado obtenido");

        Prestamo p = prestamoRepo.bloquearPorId(prestamoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Préstamo", prestamoId));
        if (!p.estaPendiente())
            throw new ConflictoException("El préstamo está %s y no admite devoluciones".formatted(p.getEstado()));

        Set<String> codigos = r.lineas().stream().map(l -> Codigos.normalizar(l.codigoEjemplar()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (codigos.size() != r.lineas().size())
            throw new SolicitudInvalidaException("Hay códigos de ejemplar repetidos");

        ejemplarRepo.bloquearPorCodigos(codigos);

        Map<String, DetallePrestamo> pendientes = detalleRepo.porPrestamo(prestamoId).stream()
                .filter(d -> d.getEstadoDetalle() == EstadoDetallePrestamo.Prestado)
                .collect(Collectors.toMap(d -> Codigos.normalizar(d.getEjemplar().getCodigoEjemplar()),
                        Function.identity()));

        LocalDateTime ahora = LocalDateTime.now();
        int diasRetraso = p.diasRetraso(ahora.toLocalDate());

        Devolucion dev = new Devolucion();
        dev.setCodigoDevolucion(Codigos.temporal());
        dev.setPrestamo(p);
        dev.setUsuario(usuario);
        dev.setFechaDevolucion(ahora);
        dev.setObservaciones(r.observaciones());

        System.out.println("DIAGNÓSTICO 3: Antes de guardar devolución");

        devolucionRepo.save(dev);

        System.out.println("DIAGNÓSTICO 4: Devolución guardada");

        dev.setCodigoDevolucion(Codigos.formatear("DEV", dev.getDevolucionId()));
        Set<Integer> librosLiberados = new HashSet<>(); // <-- Acumulador de colas de reservas
        List<LineaDevolucionResponse> lineas = new ArrayList<>();

        for (LineaDevolucionRequest l : r.lineas()) {
            DetallePrestamo d = pendientes.get(Codigos.normalizar(l.codigoEjemplar()));
            if (d == null)
                throw new ConflictoException("El ejemplar %s no está pendiente de devolución en este préstamo"
                        .formatted(l.codigoEjemplar()));

            Ejemplar e = d.getEjemplar();
            CondicionRecibida c = l.condicionRecibida();
            boolean incidencia = c == CondicionRecibida.Danado || c == CondicionRecibida.Perdido;
            if (incidencia && (l.observaciones() == null || l.observaciones().isBlank()))
                throw new SolicitudInvalidaException(
                        "El ejemplar %s: un daño o pérdida requiere observaciones".formatted(e.getCodigoEjemplar()));

            String motivo = "Devolución %s (préstamo %s): %s"
                    .formatted(dev.getCodigoDevolucion(), p.getCodigoPrestamo(), c);
            Long ref = dev.getDevolucionId();

            if (c == CondicionRecibida.Perdido) {
                movimientos.cambiarEstado(e, EstadoEjemplar.Perdido, TipoMovimiento.Perdida, usuario, "Devolucion", ref, motivo);
                d.setEstadoDetalle(EstadoDetallePrestamo.Perdido);
            } else if (c == CondicionRecibida.Danado) {
                e.setCondicionFisica(CondicionFisica.Danado);
                movimientos.cambiarEstado(e, EstadoEjemplar.Danado, TipoMovimiento.Danio, usuario, "Devolucion", ref, motivo);
                d.setEstadoDetalle(EstadoDetallePrestamo.Danado);
            } else {
                e.setCondicionFisica(c == CondicionRecibida.Bueno ? CondicionFisica.Bueno : CondicionFisica.Regular);
                movimientos.cambiarEstado(e, EstadoEjemplar.Disponible, TipoMovimiento.Devolucion, usuario, "Devolucion", ref, motivo);
                d.setEstadoDetalle(EstadoDetallePrestamo.Devuelto);
                librosLiberados.add(e.getLibro().getLibroId()); // <-- Añadido para procesar reservas
            }
            d.setFechaDevolucion(ahora);
            d.setObservacionDevolucion(l.observaciones());

            DetalleDevolucion dd = new DetalleDevolucion();
            dd.setDevolucion(dev);
            dd.setDetallePrestamo(d);
            dd.setCondicionRecibida(c);
            dd.setObservaciones(l.observaciones());
            dd.setRequiereEvaluacion(incidencia);
            detalleDevolucionRepo.save(dd);

            // Automatización de Multas por Mostrador
            multas.generarPorDevolucion(p, d, ahora, c, l.observaciones());

            lineas.add(new LineaDevolucionResponse(d.getDetallePrestamoId(), e.getCodigoEjemplar(), c,
                    incidencia, diasRetraso));
        }

        // Disparador reactivo de colas asíncronas para el Scheduler de Reservas
        librosLiberados.forEach(id -> eventos.publishEvent(new EjemplarLiberadoEvent(id)));

        p.setEstado(
                pendientes.size() - r.lineas().size() == 0
                        ? EstadoPrestamo.Devuelto
                        : EstadoPrestamo.Parcial
        );

        System.out.println("DIAGNÓSTICO 5: Finalizó el procesamiento de devolución");

        return new DevolucionResponse(
                dev.getDevolucionId(),
                dev.getCodigoDevolucion(),
                p.getPrestamoId(),
                ahora,
                p.getEstado(),
                lineas
        );
    }
}
