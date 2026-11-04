package com.example.biblionova.inventario.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.dto.*;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.Ubicacion;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.repository.EjemplarSpecs;
import com.example.biblionova.inventario.repository.MovimientoRepository;
import com.example.biblionova.inventario.repository.UbicacionRepository;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class EjemplarService {

    private static final Set<EstadoEjemplar> EN_OTRO_FLUJO =
            EnumSet.of(EstadoEjemplar.Prestado, EstadoEjemplar.Reservado,
                    EstadoEjemplar.ApartadoPedido, EstadoEjemplar.Vendido);

    private final EjemplarRepository repo;
    private final UbicacionRepository ubicacionRepo;
    private final MovimientoRepository movimientoRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public PageResponse<EjemplarResponse> buscar(EjemplarFiltro filtro, Pageable pageable) {
        Pageable p = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100),
                Sort.by("codigoEjemplar"));
        return PageResponse.de(repo.findAll(EjemplarSpecs.filtrar(filtro), p).map(this::aResponse));
    }

    @Transactional(readOnly = true)
    public EjemplarResponse obtener(Integer id) {
        return aResponse(repo.findWithDetalleByEjemplarId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ejemplar", id)));
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponse> historial(Integer id) {
        if (!repo.existsById(id)) throw new RecursoNoEncontradoException("Ejemplar", id);
        return movimientoRepo.historial(id).stream()
                .map(m -> new MovimientoResponse(m.getMovimientoId(), m.getTipoMovimiento(),
                        m.getEstadoAnterior(), m.getEstadoNuevo(), m.getReferenciaTipo(), m.getReferenciaId(),
                        m.getMotivo(), m.getFechaMovimiento(), m.getUsuario().getNombreUsuario()))
                .toList();
    }

    @Transactional
    public EjemplarResponse cambiarEstado(Integer id, CambioEstadoRequest r) {
        Ejemplar e = repo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Ejemplar", id));
        if (EN_OTRO_FLUJO.contains(e.getEstado()))
            throw new ConflictoException("El ejemplar está en estado %s; ese estado se gestiona desde su propio flujo (préstamo, reserva, pedido o venta)"
                    .formatted(e.getEstado()));
        EstadoEjemplar antes = e.getEstado();
        movimientos.cambiarEstado(e, r.accion().destino(), r.accion().tipo(),
                usuarioActual.obtener(), "AjusteManual", null, r.motivo());
        auditoria.registrar("Ejemplar", id, r.accion().name(), r.motivo(),
                datos("estado", antes), datos("estado", e.getEstado()));
        return aResponse(e);
    }

    @Transactional
    public EjemplarResponse actualizar(Integer id, ActualizarEjemplarRequest r) {
        Ejemplar e = repo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Ejemplar", id));

        if (r.ubicacionId() != null) {
            e.setUbicacion(ubicacionRepo.findById(r.ubicacionId()).filter(Ubicacion::isActiva)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Ubicación activa", r.ubicacionId())));
        }

        boolean cambiaDestino = (r.esVendible() != null && r.esVendible() != e.isEsVendible())
                || (r.esPrestamo() != null && r.esPrestamo() != e.isEsPrestamo());
        if (cambiaDestino) {
            if (e.getEstado() != EstadoEjemplar.Disponible)
                throw new ConflictoException("Solo se puede cambiar el destino (venta/préstamo) de un ejemplar Disponible");
            boolean v = r.esVendible() != null ? r.esVendible() : e.isEsVendible();
            boolean p = r.esPrestamo() != null ? r.esPrestamo() : e.isEsPrestamo();
            if (!v && !p) throw new SolicitudInvalidaException("El ejemplar debe ser vendible, prestable o ambos");
            if (v && !e.getLibro().isVentaHabilitada())
                throw new ConflictoException("El libro no tiene la venta habilitada");
            if (p && !e.getLibro().isPrestamoHabilitado())
                throw new ConflictoException("El libro no tiene el préstamo habilitado");
            e.setEsVendible(v);
            e.setEsPrestamo(p);
        }
        if (r.condicionFisica() != null) e.setCondicionFisica(r.condicionFisica());
        if (r.observaciones() != null) e.setObservaciones(r.observaciones());

        movimientos.registrarAjuste(e, usuarioActual.obtener(), r.motivo());
        return aResponse(e);
    }

    private EjemplarResponse aResponse(Ejemplar e) {
        return new EjemplarResponse(e.getEjemplarId(), e.getCodigoEjemplar(),
                new ItemRef(e.getLibro().getLibroId(), e.getLibro().getTitulo()),
                e.getUbicacion() == null ? null : new ItemRef(e.getUbicacion().getUbicacionId(), e.getUbicacion().getCodigo()),
                e.getEstado(), e.isEsVendible(), e.isEsPrestamo(), e.getCondicionFisica(),
                e.getFechaAdquisicion(), e.getCostoAdquisicion(), e.getObservaciones());
    }
}