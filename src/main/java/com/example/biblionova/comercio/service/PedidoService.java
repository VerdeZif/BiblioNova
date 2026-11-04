package com.example.biblionova.comercio.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.catalogo.entity.Libro;
import com.example.biblionova.catalogo.repository.LibroRepository;
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
import com.example.biblionova.common.util.Textos;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.service.MovimientoService;
import com.example.biblionova.prestamos.dto.EjemplarLiberadoEvent;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoService {

    private static final Map<TipoEntrega, Set<String>> METODOS = Map.of(
            TipoEntrega.Recojo, Set.of("EFECTIVO_TIENDA", "TARJETA_TIENDA", "PAGO_ONLINE"),
            TipoEntrega.Delivery, Set.of("CONTRAENTREGA", "PAGO_ONLINE"));
    private static final Set<String> ORDEN_PERMITIDO = Set.of("fechaPedido", "total", "numeroPedido");
    private static final RoundingMode RM = RoundingMode.HALF_UP;
    private final VentaService ventaService;

    @Value("${app.comercio.costo-delivery:8.00}") private BigDecimal costoDelivery;
    @Value("${app.comercio.impuesto-adicional-porcentaje:0}") private BigDecimal impuestoPct;
    @Value("${app.comercio.punto-recojo:Tienda BiblioNova}") private String puntoRecojo;
    @Value("${app.comercio.horas-confirmacion:24}") private int horasConfirmacion;
    @Value("${app.comercio.horas-recojo:72}") private int horasRecojo;
    @Value("${app.comercio.max-pedidos-pendientes:3}") private int maxPendientes;
    @Value("${app.pagos.simulacion-habilitada:true}") private boolean simulacionHabilitada;

    private final PedidoRepository pedidoRepo;
    private final DetallePedidoRepository detalleRepo;
    private final AsignacionPedidoRepository asignacionRepo;
    private final PagoPedidoRepository pagoRepo;
    private final EnvioRepository envioRepo;
    private final DireccionEntregaRepository direccionRepo;
    private final MetodoPagoRepository metodoRepo;
    private final LectorRepository lectorRepo;
    private final LibroRepository libroRepo;
    private final EjemplarRepository ejemplarRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;
    private final ApplicationEventPublisher eventos;
    private final AuditoriaService auditoria;

    private record LineaElegida(Libro libro, int cantidad, List<Ejemplar> ejemplares) {}

    // ---------------------------------------------------------------- crear

    @Transactional
    public PedidoResponse crear(PedidoRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Integer lectorId = lectorRepo.findByUsuario_UsuarioId(usuario.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", usuario.getNombreUsuario()))
                .getLectorId();

        Lector lector = lectorRepo.bloquearPorId(lectorId).orElseThrow();   // serializa los pedidos del mismo cliente
        if (!lector.isActivo()) throw new ConflictoException("Tu cuenta de lector está inactiva");
        if (pedidoRepo.countByLector_LectorIdAndEstado(lectorId, EstadoPedido.Pendiente) >= maxPendientes)
            throw new ConflictoException("Tienes %d pedidos pendientes de confirmación; espera a que se atiendan o cancélalos"
                    .formatted(maxPendientes));

        Set<String> permitidos = METODOS.get(r.tipoEntrega());
        if (!permitidos.contains(r.metodoPagoCodigo()))
            throw new SolicitudInvalidaException("Para %s los métodos de pago permitidos son: %s"
                    .formatted(r.tipoEntrega(), permitidos));
        MetodoPago metodo = metodoRepo.findByCodigoAndActivoTrue(r.metodoPagoCodigo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Método de pago activo", r.metodoPagoCodigo()));

        DireccionEntrega direccion = null;
        if (r.tipoEntrega() == TipoEntrega.Delivery) {
            if (r.direccionId() == null)
                throw new SolicitudInvalidaException("El delivery requiere una dirección de entrega");
            direccion = direccionRepo.findByDireccionIdAndLector_LectorId(r.direccionId(), lectorId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Dirección", r.direccionId()));
        }

        // Un mismo libro repetido se suma; el TreeMap fija el orden de bloqueo (libroId ascendente)
        Map<Integer, Integer> cantidades = new TreeMap<>();
        r.lineas().forEach(l -> cantidades.merge(l.libroId(), l.cantidad(), Integer::sum));

        List<LineaElegida> elegidas = new ArrayList<>();
        for (Map.Entry<Integer, Integer> e : cantidades.entrySet()) {
            if (e.getValue() > 20)
                throw new SolicitudInvalidaException("Máximo 20 unidades por libro en un pedido");
            Libro libro = libroRepo.findById(e.getKey())
                    .filter(Libro::isActivo).filter(Libro::isVentaHabilitada)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Libro disponible para la venta", e.getKey()));
            List<Ejemplar> ejemplares = ejemplarRepo.disponiblesParaVenta(e.getKey(), PageRequest.of(0, e.getValue()));
            if (ejemplares.size() < e.getValue())
                throw new ConflictoException("Stock insuficiente de '%s': solo hay %d disponible(s)"
                        .formatted(libro.getTitulo(), ejemplares.size()));
            elegidas.add(new LineaElegida(libro, e.getValue(), ejemplares));
        }

        // Totales (documento, sección 6): total = subtotal + envío + impuestos no incluidos − descuentos
        BigDecimal subtotal = elegidas.stream()
                .map(l -> l.libro().getPrecioVenta().multiply(BigDecimal.valueOf(l.cantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RM);
        BigDecimal impuesto = subtotal.multiply(impuestoPct).divide(BigDecimal.valueOf(100), 2, RM);
        BigDecimal envio = r.tipoEntrega() == TipoEntrega.Delivery ? costoDelivery.setScale(2, RM) : BigDecimal.ZERO.setScale(2);
        BigDecimal descuento = BigDecimal.ZERO.setScale(2);
        BigDecimal total = subtotal.add(impuesto).add(envio).subtract(descuento);

        Pedido p = new Pedido();
        p.setNumeroPedido(Codigos.temporal());
        p.setLector(lector);
        p.setDireccion(direccion);
        p.setTipoEntrega(r.tipoEntrega());
        p.setSubtotal(subtotal);
        p.setImpuesto(impuesto);
        p.setCostoEnvio(envio);
        p.setDescuento(descuento);
        p.setTotal(total);
        p.setObservaciones(r.observaciones());
        pedidoRepo.save(p);
        p.setNumeroPedido(Codigos.formatear("PED", p.getPedidoId()));

        for (LineaElegida l : elegidas) {
            DetallePedido d = new DetallePedido();
            d.setPedido(p);
            d.setLibro(l.libro());
            d.setCantidad(l.cantidad());
            d.setPrecioUnitario(l.libro().getPrecioVenta());
            detalleRepo.save(d);

            for (Ejemplar e : l.ejemplares()) {
                AsignacionPedido a = new AsignacionPedido();
                a.setDetallePedido(d);
                a.setEjemplar(e);
                asignacionRepo.save(a);
                movimientos.cambiarEstado(e, EstadoEjemplar.ApartadoPedido, TipoMovimiento.ApartadoPedido, usuario,
                        "Pedido", p.getPedidoId(), "Apartado para el pedido " + p.getNumeroPedido());
            }
        }

        PagoPedido pago = new PagoPedido();
        pago.setPedido(p);
        pago.setMetodoPago(metodo);
        pago.setMonto(total);
        pagoRepo.save(pago);

        Envio ev = new Envio();
        ev.setPedido(p);
        ev.setModalidad(r.tipoEntrega());
        envioRepo.save(ev);

        return aResponse(p);
    }

    // ------------------------------------------------------------- consultas

    @Transactional(readOnly = true)
    public PageResponse<PedidoResumen> buscar(PedidoFiltro filtro, Pageable pageable) {
        return PageResponse.de(pedidoRepo.findAll(PedidoSpecs.filtrar(filtro), sanear(pageable)).map(this::aResumen));
    }

    @Transactional(readOnly = true)
    public PageResponse<PedidoResumen> mios(Pageable pageable) {
        Usuario u = usuarioActual.obtener();
        Lector l = lectorRepo.findByUsuario_UsuarioId(u.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario()));
        return buscar(new PedidoFiltro(l.getLectorId(), null, null, null, null), pageable);
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long id) {
        Pedido p = pedidoRepo.findWithDetalleByPedidoId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido", id));
        Usuario u = usuarioActual.obtener();
        if (esCliente(u)) verificarDueno(p, u);
        return aResponse(p);
    }

    // --------------------------------------------------------------- flujo

    /** Confirmar un pedido que se pagará al recibir (contraentrega o en tienda). El pago online se confirma al validarlo. */
    @Transactional
    public PedidoResponse confirmar(Long id) {
        Pedido p = bloquear(id);
        if (p.getEstado() != EstadoPedido.Pendiente)
            throw new ConflictoException("Solo se confirma un pedido Pendiente (estado actual: %s)".formatted(p.getEstado()));
        boolean online = pagoRepo.findByPedido_PedidoIdOrderByFechaRegistroAsc(id).stream()
                .anyMatch(x -> "PAGO_ONLINE".equals(x.getMetodoPago().getCodigo()));
        if (online && p.getEstadoPago() != EstadoPagoPedido.Pagado)
            throw new ConflictoException("Un pedido con pago online se confirma al validar el pago");
        p.setEstado(EstadoPedido.Confirmado);
        return aResponse(p);
    }

    @Transactional
    public PedidoResponse confirmarPago(Long pedidoId, Long pagoId, ConfirmarPagoRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Pedido p = bloquear(pedidoId);
        if (p.getEstado() == EstadoPedido.Cancelado || p.getEstado() == EstadoPedido.Entregado)
            throw new ConflictoException("El pedido está %s y no admite pagos".formatted(p.getEstado()));
        PagoPedido pago = pagoRepo.findByPagoPedidoIdAndPedido_PedidoId(pagoId, pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pago", pagoId));
        if (pago.getEstado() != EstadoRegistroPago.Pendiente)
            throw new ConflictoException("El pago está %s".formatted(pago.getEstado()));
        if ("PAGO_ONLINE".equals(pago.getMetodoPago().getCodigo()))
            throw new ConflictoException("Los pagos online se procesan con la pasarela simulada (endpoint pago-simulado)");

        String ref = r == null || r.referenciaExterna() == null || r.referenciaExterna().isBlank()
                ? null : r.referenciaExterna().trim();

        EstadoPagoPedido antes = p.getEstadoPago();
        pago.setEstado(EstadoRegistroPago.Confirmado);
        pago.setFechaConfirmacion(LocalDateTime.now());
        pago.setConfirmadoPor(usuario);
        if (ref != null) pago.setReferenciaExterna(ref);

        BigDecimal confirmado = pagoRepo.totalPorEstado(pedidoId, EstadoRegistroPago.Confirmado);
        p.setEstadoPago(confirmado.compareTo(p.getTotal()) >= 0 ? EstadoPagoPedido.Pagado : EstadoPagoPedido.Parcial);
        auditoria.registrar("Pedido", pedidoId, "CONFIRMAR_PAGO",
                "Pago " + pagoId + " confirmado (" + pago.getMetodoPago().getCodigo() + ")",
                datos("estadoPago", antes), datos("estadoPago", p.getEstadoPago()));
        if (p.getEstado() == EstadoPedido.Pendiente) p.setEstado(EstadoPedido.Confirmado);
        return aResponse(p);
    }

    /** Pasarela simulada: el resultado lo elige quien prueba. No procesa dinero ni recibe datos de tarjeta. */
    @Transactional
    public PedidoResponse pagarOnlineSimulado(Long pedidoId, Long pagoId, ResultadoPagoSimulado resultado) {
        exigirSimulacion();
        Usuario usuario = usuarioActual.obtener();
        Pedido p = bloquear(pedidoId);
        if (esCliente(usuario)) verificarDueno(p, usuario);
        if (p.getEstado() != EstadoPedido.Pendiente)
            throw new ConflictoException("Solo se paga un pedido Pendiente (estado actual: %s)".formatted(p.getEstado()));

        PagoPedido pago = pagoRepo.findByPagoPedidoIdAndPedido_PedidoId(pagoId, pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pago", pagoId));
        if (!"PAGO_ONLINE".equals(pago.getMetodoPago().getCodigo()))
            throw new ConflictoException("Este pago no es online: se cobra al recibir");
        if (pago.getEstado() != EstadoRegistroPago.Pendiente)
            throw new ConflictoException("El pago está %s".formatted(pago.getEstado()));

        String ref = "SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (resultado == ResultadoPagoSimulado.APROBADO) {
            pago.setEstado(EstadoRegistroPago.Confirmado);
            pago.setReferenciaExterna(ref);
            pago.setFechaConfirmacion(LocalDateTime.now());
            pago.setConfirmadoPor(usuarioActual.sistema());      // lo confirmó la "pasarela", no una persona
            p.setEstadoPago(EstadoPagoPedido.Pagado);
            p.setEstado(EstadoPedido.Confirmado);
        } else {
            pago.setEstado(EstadoRegistroPago.Rechazado);
            pago.setReferenciaExterna(ref + "-RECHAZADO");
            p.setEstadoPago(EstadoPagoPedido.Fallido);
            p.setObservaciones(Textos.anexar(p.getObservaciones(), "Pago simulado rechazado (" + ref + ")", 500));
        }
        auditoria.registrar("Pedido", pedidoId,
                resultado == ResultadoPagoSimulado.APROBADO ? "PAGO_SIMULADO_APROBADO" : "PAGO_SIMULADO_RECHAZADO",
                "Pasarela simulada, referencia " + ref, null, datos("estadoPago", p.getEstadoPago()));
        return aResponse(p);
    }

    /** Tras un rechazo, el cliente puede volver a intentar sin rehacer el pedido (el stock sigue apartado). */
    @Transactional
    public PedidoResponse reintentarPagoOnline(Long pedidoId) {
        exigirSimulacion();
        Usuario usuario = usuarioActual.obtener();
        Pedido p = bloquear(pedidoId);
        if (esCliente(usuario)) verificarDueno(p, usuario);
        if (p.getEstado() != EstadoPedido.Pendiente || p.getEstadoPago() != EstadoPagoPedido.Fallido)
            throw new ConflictoException("Solo se reintenta un pago rechazado en un pedido Pendiente");

        MetodoPago metodo = metodoRepo.findByCodigoAndActivoTrue("PAGO_ONLINE")
                .orElseThrow(() -> new RecursoNoEncontradoException("Método de pago activo", "PAGO_ONLINE"));
        PagoPedido nuevo = new PagoPedido();
        nuevo.setPedido(p);
        nuevo.setMetodoPago(metodo);
        nuevo.setMonto(p.getTotal());
        pagoRepo.save(nuevo);
        p.setEstadoPago(EstadoPagoPedido.Pendiente);
        return aResponse(p);
    }

    private void exigirSimulacion() {
        if (!simulacionHabilitada)
            throw new ConflictoException("La pasarela de pago simulada está deshabilitada");
    }

    @Transactional
    public PedidoResponse cambiarEstado(Long id, CambioEstadoPedidoRequest r) {
        Pedido p = bloquear(id);
        Envio envio = envioRepo.findByPedido_PedidoId(id)
                .orElseThrow(() -> new IllegalStateException("El pedido %d no tiene envío".formatted(id)));
        EstadoPedido destino = r.estado();
        EstadoPedido actual = p.getEstado();

        boolean valido = switch (destino) {
            case Preparando -> actual == EstadoPedido.Confirmado;
            case ListoRecojo -> actual == EstadoPedido.Preparando && p.getTipoEntrega() == TipoEntrega.Recojo;
            case Despachado -> actual == EstadoPedido.Preparando && p.getTipoEntrega() == TipoEntrega.Delivery;
            case Entregado -> actual == EstadoPedido.ListoRecojo || actual == EstadoPedido.Despachado;
            default -> throw new SolicitudInvalidaException("Usa /confirmar para confirmar y /cancelar para cancelar");
        };
        if (!valido)
            throw new ConflictoException("No se puede pasar de %s a %s en un pedido de tipo %s"
                    .formatted(actual, destino, p.getTipoEntrega()));

        LocalDateTime ahora = LocalDateTime.now();
        switch (destino) {
            case Preparando -> {
                envio.setEstado(EstadoEnvio.Preparando);
                envio.setFechaPreparacion(ahora);
            }
            case ListoRecojo -> {
                envio.setEstado(EstadoEnvio.ListoRecojo);
                envio.setFechaDespacho(ahora);
            }
            case Despachado -> {
                envio.setEstado(EstadoEnvio.EnRuta);
                envio.setFechaDespacho(ahora);
                envio.setOperador(r.operador());
                envio.setCodigoSeguimiento(r.codigoSeguimiento());
            }
            case Entregado -> {
                if (p.getEstadoPago() != EstadoPagoPedido.Pagado)
                    throw new ConflictoException("Confirma el pago antes de entregar: es el momento de cobrar en contraentrega o en tienda");
                if (r.recibidoPor() == null || r.recibidoPor().isBlank())
                    throw new SolicitudInvalidaException("Indica quién recibió el pedido");
                envio.setEstado(EstadoEnvio.Entregado);
                envio.setFechaEntrega(ahora);
                envio.setRecibidoPor(r.recibidoPor().trim());
                ventaService.crearDesdePedido(p, usuarioActual.obtener());
            }
            default -> { }
        }
        if (r.observaciones() != null && !r.observaciones().isBlank()) envio.setObservaciones(r.observaciones());
        p.setEstado(destino);
        auditoria.registrar("Pedido", id, "CAMBIAR_ESTADO", "Pedido " + p.getNumeroPedido(),
                datos("estado", actual), datos("estado", destino));
        return aResponse(p);
    }

    @Transactional
    public PedidoResponse cancelar(Long id, MotivoRequest r) {
        Usuario usuario = usuarioActual.obtener();
        Pedido p = bloquear(id);
        boolean cliente = esCliente(usuario);
        if (cliente) verificarDueno(p, usuario);

        Set<EstadoPedido> cancelables = cliente
                ? EnumSet.of(EstadoPedido.Pendiente, EstadoPedido.Confirmado)
                : EnumSet.of(EstadoPedido.Pendiente, EstadoPedido.Confirmado, EstadoPedido.Preparando, EstadoPedido.ListoRecojo);
        if (!cancelables.contains(p.getEstado()))
            throw new ConflictoException("Un pedido %s ya no se puede cancelar".formatted(p.getEstado()));
        if (p.getEstadoPago() == EstadoPagoPedido.Pagado || p.getEstadoPago() == EstadoPagoPedido.Parcial)
            throw new ConflictoException("El pedido tiene un pago confirmado; el sistema no gestiona devoluciones de dinero");

        cancelarInterno(p, usuario, r.motivo());
        return aResponse(p);
    }

    // ------------------------------------------------------ expiración automática

    @Transactional(readOnly = true)
    public List<Long> idsPendientesVencidos() {
        return pedidoRepo.idsPendientesVencidos(LocalDateTime.now().minusHours(horasConfirmacion));
    }

    @Transactional(readOnly = true)
    public List<Long> idsRecojoVencido() {
        return envioRepo.idsRecojoVencido(LocalDateTime.now().minusHours(horasRecojo));
    }

    @Transactional
    public void expirarUno(Long id) {
        Pedido p = bloquear(id);
        if (p.getEstadoPago() == EstadoPagoPedido.Pagado || p.getEstadoPago() == EstadoPagoPedido.Parcial) return;
        LocalDateTime ahora = LocalDateTime.now();
        boolean sinConfirmar = p.getEstado() == EstadoPedido.Pendiente
                && p.getFechaPedido().isBefore(ahora.minusHours(horasConfirmacion));
        boolean recojoVencido = p.getEstado() == EstadoPedido.ListoRecojo
                && envioRepo.findByPedido_PedidoId(id)
                .map(e -> e.getFechaDespacho() != null && e.getFechaDespacho().isBefore(ahora.minusHours(horasRecojo)))
                .orElse(false);
        if (!sinConfirmar && !recojoVencido) return;
        cancelarInterno(p, usuarioActual.sistema(),
                sinConfirmar ? "Pedido no confirmado a tiempo" : "Plazo de recojo vencido");
    }

    // ----------------------------------------------------------------- internos

    private void cancelarInterno(Pedido p, Usuario usuario, String motivo) {
        Long id = p.getPedidoId();
        EstadoPedido antes = p.getEstado();
        List<AsignacionPedido> activas = asignacionRepo.activasConEjemplar(id);
        LocalDateTime ahora = LocalDateTime.now();

        if (!activas.isEmpty()) {
            List<Integer> ids = activas.stream().map(a -> a.getEjemplar().getEjemplarId()).toList();
            List<Ejemplar> ejemplares = ejemplarRepo.bloquearPorIds(ids);      // orden ascendente por id
            Set<Integer> libros = new LinkedHashSet<>();
            for (Ejemplar e : ejemplares) {
                movimientos.cambiarEstado(e, EstadoEjemplar.Disponible, TipoMovimiento.LiberacionPedido, usuario,
                        "Pedido", id, "Pedido %s cancelado: %s".formatted(p.getNumeroPedido(), motivo));
                libros.add(e.getLibro().getLibroId());
            }
            activas.forEach(a -> a.setFechaLiberacion(ahora));
            libros.forEach(l -> eventos.publishEvent(new EjemplarLiberadoEvent(l)));   // por si alguien esperaba una reserva
        }
        pagoRepo.findByPedido_PedidoIdOrderByFechaRegistroAsc(id).stream()
                .filter(x -> x.getEstado() == EstadoRegistroPago.Pendiente)
                .forEach(x -> x.setEstado(EstadoRegistroPago.Anulado));
        envioRepo.findByPedido_PedidoId(id).ifPresent(e -> e.setEstado(EstadoEnvio.Cancelado));

        p.setEstado(EstadoPedido.Cancelado);
        p.setObservaciones(Textos.anexar(p.getObservaciones(),
                "Cancelado por %s: %s".formatted(usuario.getNombreUsuario(), motivo), 500));
        auditoria.registrarComo(usuario, "Pedido", id, "CANCELAR", motivo,
                datos("estado", antes), datos("estado", EstadoPedido.Cancelado));
    }

    private Pedido bloquear(Long id) {
        return pedidoRepo.bloquearPorId(id).orElseThrow(() -> new RecursoNoEncontradoException("Pedido", id));
    }

    private boolean esCliente(Usuario u) { return "Cliente".equalsIgnoreCase(u.getRol().getNombre()); }

    private void verificarDueno(Pedido p, Usuario u) {
        Usuario dueno = p.getLector().getUsuario();
        if (dueno == null || !dueno.getUsuarioId().equals(u.getUsuarioId()))
            throw new RecursoNoEncontradoException("Pedido", p.getPedidoId());   // 404: no revelar que existe
    }

    private Pageable sanear(Pageable p) {
        Sort sort = Sort.by(p.getSort().stream().filter(o -> ORDEN_PERMITIDO.contains(o.getProperty())).toList());
        if (sort.isUnsorted()) sort = Sort.by(Sort.Direction.DESC, "fechaPedido");
        return PageRequest.of(p.getPageNumber(), Math.min(p.getPageSize(), 50), sort);
    }

    private PedidoResumen aResumen(Pedido p) {
        return new PedidoResumen(p.getPedidoId(), p.getNumeroPedido(),
                new ItemRef(p.getLector().getLectorId(), p.getLector().getNombreCompleto()),
                p.getTipoEntrega(), p.getEstado(), p.getEstadoPago(), p.getTotal(), p.getFechaPedido());
    }

    private PedidoResponse aResponse(Pedido p) {
        Long id = p.getPedidoId();

        Map<Long, List<String>> codigos = asignacionRepo.activasConEjemplar(id).stream()
                .collect(Collectors.groupingBy(a -> a.getDetallePedido().getDetallePedidoId(),
                        Collectors.mapping(a -> a.getEjemplar().getCodigoEjemplar(), Collectors.toList())));

        List<LineaPedidoResponse> lineas = detalleRepo.porPedido(id).stream()
                .map(d -> new LineaPedidoResponse(d.getDetallePedidoId(),
                        new ItemRef(d.getLibro().getLibroId(), d.getLibro().getTitulo()),
                        d.getCantidad(), d.getPrecioUnitario(),
                        d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())),
                        codigos.getOrDefault(d.getDetallePedidoId(), List.of())))
                .toList();

        List<PagoPedidoResponse> pagos = pagoRepo.findByPedido_PedidoIdOrderByFechaRegistroAsc(id).stream()
                .map(x -> new PagoPedidoResponse(x.getPagoPedidoId(), x.getMetodoPago().getCodigo(),
                        x.getMetodoPago().getNombre(), x.getMonto(), x.getEstado(), x.getReferenciaExterna(),
                        x.getFechaRegistro(), x.getFechaConfirmacion(),
                        x.getConfirmadoPor() == null ? null : x.getConfirmadoPor().getNombreUsuario()))
                .toList();

        Envio envio = envioRepo.findByPedido_PedidoId(id).orElse(null);
        LocalDateTime plazo = null;
        boolean plazoVencido = false;
        if (p.getTipoEntrega() == TipoEntrega.Recojo && p.getEstado() == EstadoPedido.ListoRecojo
                && envio != null && envio.getFechaDespacho() != null) {
            plazo = envio.getFechaDespacho().plusHours(horasRecojo);
            plazoVencido = LocalDateTime.now().isAfter(plazo);
        }

        return new PedidoResponse(id, p.getNumeroPedido(),
                new ItemRef(p.getLector().getLectorId(), p.getLector().getNombreCompleto()),
                p.getTipoEntrega(), p.getEstado(), p.getEstadoPago(), p.getFechaPedido(),
                p.getSubtotal(), p.getImpuesto(), p.getCostoEnvio(), p.getDescuento(), p.getTotal(),
                p.getObservaciones(),
                p.getDireccion() == null ? null : DireccionResponse.de(p.getDireccion()),
                p.getTipoEntrega() == TipoEntrega.Recojo ? puntoRecojo : null,
                plazo, plazoVencido, lineas, pagos,
                envio == null ? null : new EnvioResponse(envio.getEstado(), envio.getOperador(),
                        envio.getCodigoSeguimiento(), envio.getFechaPreparacion(), envio.getFechaDespacho(),
                        envio.getFechaEntrega(), envio.getRecibidoPor()));
    }
}