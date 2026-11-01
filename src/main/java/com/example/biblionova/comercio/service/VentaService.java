package com.example.biblionova.comercio.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.comercio.dto.*;
import com.example.biblionova.comercio.entity.*;
import com.example.biblionova.comercio.repository.*;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.pago.MetodoPago;
import com.example.biblionova.common.pago.MetodoPagoRepository;
import com.example.biblionova.common.util.Codigos;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.service.MovimientoService;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class VentaService {

    private static final Set<String> METODOS_POS = Set.of("EFECTIVO_TIENDA", "TARJETA_TIENDA");
    private static final Set<String> ORDEN_PERMITIDO = Set.of("fechaVenta", "total", "numeroVenta");
    private static final String COMPROBANTE = "Ticket interno";
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    @Value("${app.comercio.impuesto-adicional-porcentaje:0}") private BigDecimal impuestoPct;

    private final VentaRepository ventaRepo;
    private final DetalleVentaRepository detalleRepo;
    private final PagoVentaRepository pagoRepo;
    private final AsignacionPedidoRepository asignacionRepo;
    private final EjemplarRepository ejemplarRepo;
    private final LectorRepository lectorRepo;
    private final MetodoPagoRepository metodoRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    // ------------------------------------------------------------ venta en mostrador

    @Transactional
    public VentaResponse registrarPresencial(VentaPresencialRequest r) {
        Usuario usuario = usuarioActual.obtener();

        if (!METODOS_POS.contains(r.metodoPagoCodigo()))
            throw new SolicitudInvalidaException("En mostrador los métodos permitidos son: " + METODOS_POS);
        MetodoPago metodo = metodoRepo.findByCodigoAndActivoTrue(r.metodoPagoCodigo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Método de pago activo", r.metodoPagoCodigo()));

        Lector lector = null;
        if (r.lectorId() != null) {
            lector = lectorRepo.findById(r.lectorId()).filter(Lector::isActivo)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Lector activo", r.lectorId()));
        }

        Set<String> codigos = r.codigosEjemplar().stream()
                .map(Codigos::normalizar).collect(Collectors.toCollection(LinkedHashSet::new));
        if (codigos.size() != r.codigosEjemplar().size())
            throw new SolicitudInvalidaException("Hay códigos de ejemplar repetidos");

        List<Ejemplar> ejemplares = ejemplarRepo.bloquearPorCodigos(codigos);
        Set<String> encontrados = ejemplares.stream()
                .map(e -> Codigos.normalizar(e.getCodigoEjemplar())).collect(Collectors.toSet());
        if (encontrados.size() != codigos.size()) {
            Set<String> faltantes = new LinkedHashSet<>(codigos);
            faltantes.removeAll(encontrados);
            throw new RecursoNoEncontradoException("Ejemplar", faltantes);
        }
        for (Ejemplar e : ejemplares) {
            if (e.getEstado() != EstadoEjemplar.Disponible)
                throw new ConflictoException("El ejemplar %s no está disponible (estado: %s)"
                        .formatted(e.getCodigoEjemplar(), e.getEstado()));
            if (!e.isEsVendible())
                throw new ConflictoException("El ejemplar %s no está destinado a la venta".formatted(e.getCodigoEjemplar()));
            if (!e.getLibro().isActivo() || !e.getLibro().isVentaHabilitada())
                throw new ConflictoException("El libro '%s' no tiene la venta habilitada".formatted(e.getLibro().getTitulo()));
        }

        // total = subtotal + impuestos no incluidos − descuentos (documento, sección 6)
        BigDecimal subtotal = ejemplares.stream().map(e -> e.getLibro().getPrecioVenta())
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RM);
        BigDecimal impuesto = subtotal.multiply(impuestoPct).divide(BigDecimal.valueOf(100), 2, RM);
        BigDecimal descuento = BigDecimal.ZERO.setScale(2);
        BigDecimal total = subtotal.add(impuesto).subtract(descuento);
        if (total.signum() <= 0)
            throw new ConflictoException("El total de la venta debe ser mayor a cero; revisa el precio de los libros");

        BigDecimal vuelto = null;
        if ("EFECTIVO_TIENDA".equals(metodo.getCodigo())) {
            if (r.montoRecibido() == null) throw new SolicitudInvalidaException("Indica el monto recibido en efectivo");
            if (r.montoRecibido().compareTo(total) < 0)
                throw new SolicitudInvalidaException("El monto recibido (S/ %s) no cubre el total (S/ %s)"
                        .formatted(r.montoRecibido().toPlainString(), total.toPlainString()));
            vuelto = r.montoRecibido().subtract(total);
        }

        Venta v = new Venta();
        v.setNumeroVenta(Codigos.temporal());
        v.setCanal(CanalVenta.Presencial);
        v.setLector(lector);
        v.setUsuario(usuario);
        v.setSubtotal(subtotal);
        v.setImpuesto(impuesto);
        v.setDescuento(descuento);
        v.setTotal(total);
        v.setEstado(EstadoVenta.Completada);
        v.setTipoComprobante(COMPROBANTE);
        v.setObservaciones(r.observaciones());
        ventaRepo.save(v);
        v.setNumeroVenta(Codigos.formatear("VEN", v.getVentaId()));
        v.setNumeroComprobante(v.getNumeroVenta());

        List<DetalleVenta> detalles = new ArrayList<>();
        for (Ejemplar e : ejemplares) {
            DetalleVenta d = new DetalleVenta();
            d.setVenta(v);
            d.setEjemplar(e);
            d.setPrecioUnitario(e.getLibro().getPrecioVenta());
            detalleRepo.save(d);
            detalles.add(d);
            movimientos.cambiarEstado(e, EstadoEjemplar.Vendido, TipoMovimiento.Venta, usuario,
                    "Venta", v.getVentaId().longValue(), "Venta en mostrador " + v.getNumeroVenta());
        }

        // En mostrador el cobro es inmediato; aquí solo se registra (no se procesa ninguna tarjeta real)
        PagoVenta pago = new PagoVenta();
        pago.setVenta(v);
        pago.setMetodoPago(metodo);
        pago.setMonto(total);
        pago.setEstado(EstadoRegistroPago.Confirmado);
        pago.setReferenciaPago(r.referenciaPago());
        pago.setFechaConfirmacion(LocalDateTime.now());
        pago.setUsuario(usuario);
        pagoRepo.save(pago);

        auditoria.registrar("Venta", v.getVentaId(), "VENTA_PRESENCIAL",
                "Venta " + v.getNumeroVenta() + " por S/ " + total.toPlainString(), null,
                datos("total", total, "metodo", metodo.getCodigo(), "lectorId", r.lectorId(),
                        "ejemplares", ejemplares.stream().map(Ejemplar::getCodigoEjemplar).toList()));

        return aResponse(v, detalles, List.of(pago), vuelto);
    }

    // ----------------------------------------------- venta online (al entregar el pedido)

    /** Lo llama PedidoService dentro de su transacción. No crea pagosVentas: el cobro ya está en pagosPedidos. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Venta crearDesdePedido(Pedido p, Usuario usuario) {
        List<AsignacionPedido> activas = asignacionRepo.activasConEjemplar(p.getPedidoId());
        if (activas.isEmpty())
            throw new IllegalStateException("El pedido %s no tiene ejemplares asignados".formatted(p.getNumeroPedido()));
        ejemplarRepo.bloquearPorIds(activas.stream().map(a -> a.getEjemplar().getEjemplarId()).toList());

        Venta v = new Venta();
        v.setNumeroVenta(Codigos.temporal());
        v.setCanal(CanalVenta.Online);
        v.setPedido(p);
        v.setLector(p.getLector());
        v.setUsuario(usuario);
        v.setSubtotal(p.getSubtotal());
        v.setImpuesto(p.getImpuesto());
        v.setDescuento(p.getDescuento());
        v.setTotal(p.getTotal());            // incluye el costo de envío: ventas no tiene columna aparte
        v.setEstado(EstadoVenta.Completada);
        v.setTipoComprobante(COMPROBANTE);
        String nota = "Entrega del pedido " + p.getNumeroPedido();
        if (p.getCostoEnvio().signum() > 0) nota += " | el total incluye envío S/ " + p.getCostoEnvio().toPlainString();
        v.setObservaciones(nota);
        ventaRepo.save(v);
        v.setNumeroVenta(Codigos.formatear("VEN", v.getVentaId()));
        v.setNumeroComprobante(v.getNumeroVenta());

        for (AsignacionPedido a : activas) {
            DetalleVenta d = new DetalleVenta();
            d.setVenta(v);
            d.setEjemplar(a.getEjemplar());
            d.setPrecioUnitario(a.getDetallePedido().getPrecioUnitario());   // el precio de cuando se hizo el pedido
            detalleRepo.save(d);
            movimientos.cambiarEstado(a.getEjemplar(), EstadoEjemplar.Vendido, TipoMovimiento.Venta, usuario,
                    "Venta", v.getVentaId().longValue(), "Entrega del pedido " + p.getNumeroPedido());
        }
        auditoria.registrar("Venta", v.getVentaId(), "VENTA_ONLINE",
                "Venta " + v.getNumeroVenta() + " por entrega de " + p.getNumeroPedido(), null,
                datos("total", v.getTotal(), "pedido", p.getNumeroPedido()));
        return v;
    }

    // ------------------------------------------------------------------ consultas

    @Transactional(readOnly = true)
    public PageResponse<VentaResumen> buscar(VentaFiltro f, Pageable pageable) {
        return PageResponse.de(ventaRepo.findAll(VentaSpecs.filtrar(f), sanear(pageable)).map(v ->
                new VentaResumen(v.getVentaId(), v.getNumeroVenta(), v.getCanal(), v.getEstado(), v.getFechaVenta(),
                        v.getLector() == null ? null : new ItemRef(v.getLector().getLectorId(), v.getLector().getNombreCompleto()),
                        v.getTotal())));
    }

    @Transactional(readOnly = true)
    public VentaResponse obtener(Integer id) {
        return detalle(ventaRepo.findWithDetalleByVentaId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta", id)));
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerPorPedido(Long pedidoId) {
        return detalle(ventaRepo.findWithDetalleByPedido_PedidoId(pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta del pedido", pedidoId)));
    }

    // ------------------------------------------------------------------ internos

    private VentaResponse detalle(Venta v) {
        return aResponse(v, detalleRepo.porVenta(v.getVentaId()),
                pagoRepo.findByVenta_VentaIdOrderByFechaRegistroAsc(v.getVentaId()), null);
    }

    private Pageable sanear(Pageable p) {
        Sort sort = Sort.by(p.getSort().stream().filter(o -> ORDEN_PERMITIDO.contains(o.getProperty())).toList());
        if (sort.isUnsorted()) sort = Sort.by(Sort.Direction.DESC, "fechaVenta");
        return PageRequest.of(p.getPageNumber(), Math.min(p.getPageSize(), 50), sort);
    }

    private VentaResponse aResponse(Venta v, List<DetalleVenta> detalles, List<PagoVenta> pagos, BigDecimal vuelto) {
        return new VentaResponse(v.getVentaId(), v.getNumeroVenta(), v.getCanal(), v.getEstado(), v.getFechaVenta(),
                v.getLector() == null ? null : new ItemRef(v.getLector().getLectorId(), v.getLector().getNombreCompleto()),
                v.getPedido() == null ? null : v.getPedido().getPedidoId(),
                v.getPedido() == null ? null : v.getPedido().getNumeroPedido(),
                v.getUsuario() == null ? null : v.getUsuario().getNombreUsuario(),
                v.getSubtotal(), v.getImpuesto(), v.getDescuento(), v.getTotal(),
                v.getTipoComprobante(), v.getNumeroComprobante(), v.getObservaciones(),
                detalles.stream().map(d -> new LineaVentaResponse(d.getDetalleVentaId(),
                        d.getEjemplar().getEjemplarId(), d.getEjemplar().getCodigoEjemplar(),
                        new ItemRef(d.getEjemplar().getLibro().getLibroId(), d.getEjemplar().getLibro().getTitulo()),
                        d.getPrecioUnitario(), d.getPrecioUnitario())).toList(),
                pagos.stream().map(x -> new PagoVentaResponse(x.getPagoVentaId(), x.getMetodoPago().getCodigo(),
                        x.getMetodoPago().getNombre(), x.getMonto(), x.getEstado(), x.getReferenciaPago(),
                        x.getFechaConfirmacion(), x.getUsuario() == null ? null : x.getUsuario().getNombreUsuario())).toList(),
                vuelto);
    }
}