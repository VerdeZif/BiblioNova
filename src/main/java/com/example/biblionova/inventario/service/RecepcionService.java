package com.example.biblionova.inventario.service;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.catalogo.entity.Libro;
import com.example.biblionova.catalogo.repository.LibroRepository;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.dto.*;
import com.example.biblionova.inventario.entity.*;
import com.example.biblionova.inventario.repository.DetalleRecepcionRepository;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import com.example.biblionova.inventario.repository.RecepcionRepository;
import com.example.biblionova.inventario.repository.ProveedorRepository;
import com.example.biblionova.inventario.repository.UbicacionRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecepcionService {

    private final RecepcionRepository recepcionRepo;
    private final DetalleRecepcionRepository detalleRepo;
    private final EjemplarRepository ejemplarRepo;
    private final LibroRepository libroRepo;
    private final ProveedorRepository proveedorRepo;
    private final UbicacionRepository ubicacionRepo;
    private final MovimientoService movimientos;
    private final UsuarioActual usuarioActual;

    @Transactional
    public RecepcionResponse registrar(RecepcionRequest r) {
        validarOrigen(r);
        Usuario usuario = usuarioActual.obtener();

        Proveedor proveedor = r.proveedorId() == null ? null
                : proveedorRepo.findById(r.proveedorId()).filter(Proveedor::isActivo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor activo", r.proveedorId()));

        Recepcion rec = new Recepcion();
        rec.setCodigoRecepcion("TMP-" + UUID.randomUUID().toString().replace("-", ""));
        rec.setTipoOrigen(r.tipoOrigen());
        rec.setProveedor(proveedor);
        rec.setDonante(r.donante());
        rec.setDocumentoReferencia(r.documentoReferencia());
        rec.setObservaciones(r.observaciones());
        rec.setUsuario(usuario);
        recepcionRepo.save(rec);
        rec.setCodigoRecepcion("REC-%d-%06d".formatted(LocalDate.now().getYear(), rec.getRecepcionId()));

        LocalDate hoy = LocalDate.now();
        List<LineaRecepcionResponse> lineas = new ArrayList<>();

        for (LineaRecepcionRequest l : r.lineas()) {
            Libro libro = libroRepo.findById(l.libroId()).filter(Libro::isActivo)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Libro activo", l.libroId()));

            boolean vendible = l.esVendible() != null ? l.esVendible() : libro.isVentaHabilitada();
            boolean prestable = l.esPrestamo() != null ? l.esPrestamo() : libro.isPrestamoHabilitado();
            if (vendible && !libro.isVentaHabilitada())
                throw new ConflictoException("El libro '%s' no tiene la venta habilitada".formatted(libro.getTitulo()));
            if (prestable && !libro.isPrestamoHabilitado())
                throw new ConflictoException("El libro '%s' no tiene el préstamo habilitado".formatted(libro.getTitulo()));
            if (!vendible && !prestable)
                throw new SolicitudInvalidaException("Cada ejemplar debe ser vendible, prestable o ambos");

            Ubicacion ubicacion = l.ubicacionId() == null ? null
                    : ubicacionRepo.findById(l.ubicacionId()).filter(Ubicacion::isActiva)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Ubicación activa", l.ubicacionId()));

            CondicionFisica condicion = l.condicionFisica() != null ? l.condicionFisica() : CondicionFisica.Bueno;

            DetalleRecepcion d = new DetalleRecepcion();
            d.setRecepcion(rec);
            d.setLibro(libro);
            d.setCantidad(l.cantidad());
            d.setCostoUnitario(l.costoUnitario());
            detalleRepo.save(d);

            List<String> codigos = new ArrayList<>();
            for (int i = 1; i <= l.cantidad(); i++) {
                Ejemplar e = new Ejemplar();
                e.setCodigoEjemplar("%s-D%d-%03d".formatted(rec.getCodigoRecepcion(), d.getDetalleRecepcionId(), i));
                e.setLibro(libro);
                e.setUbicacion(ubicacion);
                e.setFechaAdquisicion(hoy);
                e.setCostoAdquisicion(l.costoUnitario());
                e.setEsVendible(vendible);
                e.setEsPrestamo(prestable);
                e.setCondicionFisica(condicion);
                e.setObservaciones(l.observaciones());
                e.setDetalleRecepcion(d);
                e.setEstado(condicion == CondicionFisica.Danado ? EstadoEjemplar.Danado : EstadoEjemplar.Disponible);
                ejemplarRepo.save(e);

                movimientos.registrarEntrada(e, usuario, "Recepcion", rec.getRecepcionId(),
                        "Recepción " + rec.getCodigoRecepcion());
                codigos.add(e.getCodigoEjemplar());
            }
            lineas.add(new LineaRecepcionResponse(d.getDetalleRecepcionId(),
                    new ItemRef(libro.getLibroId(), libro.getTitulo()), l.cantidad(), l.costoUnitario(), codigos));
        }
        return aResponse(rec, lineas);
    }

    @Transactional(readOnly = true)
    public PageResponse<RecepcionResumen> listar(Pageable pageable) {
        Pageable p = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50),
                Sort.by(Sort.Direction.DESC, "fechaRecepcion"));
        return PageResponse.de(recepcionRepo.findAll(p).map(rec -> new RecepcionResumen(
                rec.getRecepcionId(), rec.getCodigoRecepcion(), rec.getTipoOrigen(),
                rec.getProveedor() != null ? rec.getProveedor().getRazonSocial() : rec.getDonante(),
                rec.getFechaRecepcion(), rec.getUsuario().getNombreUsuario())));
    }

    @Transactional(readOnly = true)
    public RecepcionResponse obtener(Long id) {
        Recepcion rec = recepcionRepo.findWithDetailByRecepcionId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Recepción", id));
        Map<Long, List<String>> codigos = ejemplarRepo.porRecepcion(id).stream()
                .collect(Collectors.groupingBy(e -> e.getDetalleRecepcion().getDetalleRecepcionId(),
                        Collectors.mapping(Ejemplar::getCodigoEjemplar, Collectors.toList())));
        List<LineaRecepcionResponse> lineas = detalleRepo.findByRecepcion_RecepcionId(id).stream()
                .map(d -> new LineaRecepcionResponse(d.getDetalleRecepcionId(),
                        new ItemRef(d.getLibro().getLibroId(), d.getLibro().getTitulo()),
                        d.getCantidad(), d.getCostoUnitario(),
                        codigos.getOrDefault(d.getDetalleRecepcionId(), List.of())))
                .toList();
        return aResponse(rec, lineas);
    }

    private void validarOrigen(RecepcionRequest r) {
        switch (r.tipoOrigen()) {
            case Compra -> {
                if (r.proveedorId() == null)
                    throw new SolicitudInvalidaException("Una compra requiere proveedor");
                if (r.lineas().stream().anyMatch(l -> l.costoUnitario() == null))
                    throw new SolicitudInvalidaException("Una compra requiere el costo unitario de cada línea");
            }
            case Donacion -> {
                if (r.donante() == null || r.donante().isBlank())
                    throw new SolicitudInvalidaException("Una donación requiere el nombre del donante");
            }
            case Otro -> { }
        }
    }

    private RecepcionResponse aResponse(Recepcion rec, List<LineaRecepcionResponse> lineas) {
        Proveedor p = rec.getProveedor();
        return new RecepcionResponse(rec.getRecepcionId(), rec.getCodigoRecepcion(), rec.getTipoOrigen(),
                p == null ? null : new ItemRef(p.getProveedorId(), p.getRazonSocial()),
                rec.getDonante(), rec.getDocumentoReferencia(), rec.getFechaRecepcion(),
                rec.getUsuario().getNombreUsuario(), rec.getObservaciones(), lineas);
    }
}
