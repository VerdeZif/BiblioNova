package com.example.biblionova.catalogo.service;

import com.example.biblionova.auditoria.service.AuditoriaService;          // <-- AUDITORÍA
import com.example.biblionova.catalogo.dto.*;
import com.example.biblionova.catalogo.entity.Autor;
import com.example.biblionova.catalogo.entity.Libro;
import com.example.biblionova.catalogo.repository.*;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.inventario.dto.StockLibro;
import com.example.biblionova.inventario.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;                                                // <-- AUDITORÍA
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;   // <-- AUDITORÍA

@Service
@RequiredArgsConstructor
public class LibroService {

    private static final Set<String> ORDEN_PERMITIDO =
            Set.of("titulo", "precioVenta", "fechaRegistro", "anioPublicacion");

    private final LibroRepository libroRepo;
    private final CategoriaRepository categoriaRepo;
    private final EditorialRepository editorialRepo;
    private final AutorRepository autorRepo;
    private final StockService stockService;
    private final AuditoriaService auditoria;                               // <-- AUDITORÍA

    @Transactional(readOnly = true)
    public PageResponse<LibroResponse> buscar(LibroFiltro filtro, Pageable pageable, boolean soloActivos) {
        Page<Libro> page = libroRepo.findAll(LibroSpecs.filtrar(filtro, soloActivos), sanear(pageable));
        Map<Integer, StockLibro> stock = stockService.porLibros(
                page.getContent().stream().map(Libro::getLibroId).toList()); // 1 sola consulta agrupada
        return PageResponse.de(page.map(l ->
                aResponse(l, stock.getOrDefault(l.getLibroId(), StockLibro.vacio(l.getLibroId())))));
    }

    @Transactional(readOnly = true)
    public LibroResponse obtener(Integer id, boolean soloActivos) {
        Libro l = libroRepo.findWithDetalleByLibroId(id)
                .filter(x -> !soloActivos || x.isActivo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Libro", id));
        return aResponse(l, stockService.porLibro(l.getLibroId()));
    }

    @Transactional
    public LibroResponse crear(LibroRequest r) {
        String isbn = normalizarIsbn(r.isbn());
        if (isbn != null && libroRepo.existsByIsbn(isbn))
            throw new ConflictoException("Ya existe un libro con ese ISBN");
        Libro l = new Libro();
        aplicar(l, r, isbn);
        Libro guardado = libroRepo.save(l);
        auditoria.registrar("Libro", guardado.getLibroId(), "CREAR",    // <-- AUDITORÍA
                "Libro creado: " + guardado.getTitulo(), null, instantanea(guardado));
        return aResponse(guardado, stockService.porLibro(guardado.getLibroId()));
    }

    @Transactional
    public LibroResponse actualizar(Integer id, LibroRequest r) {
        Libro l = libroRepo.findWithDetalleByLibroId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Libro", id));
        String isbn = normalizarIsbn(r.isbn());
        if (isbn != null && libroRepo.existsByIsbnAndLibroIdNot(isbn, id))
            throw new ConflictoException("Ya existe otro libro con ese ISBN");

        Map<String, Object> antes = instantanea(l);                         // <-- AUDITORÍA (antes de cambiar)
        BigDecimal precioAntes = l.getPrecioVenta();                        // <-- AUDITORÍA

        aplicar(l, r, isbn);

        boolean cambioPrecio = precioAntes.compareTo(l.getPrecioVenta()) != 0;   // <-- AUDITORÍA
        auditoria.registrar("Libro", id, cambioPrecio ? "CAMBIAR_PRECIO" : "ACTUALIZAR",
                "Libro actualizado: " + l.getTitulo(), antes, instantanea(l));

        return aResponse(l, stockService.porLibro(l.getLibroId()));
    }

    @Transactional
    public LibroResponse cambiarActivo(Integer id, boolean activo) {
        Libro l = libroRepo.findWithDetalleByLibroId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Libro", id));
        boolean antes = l.isActivo();                                       // <-- AUDITORÍA
        l.setActivo(activo);
        auditoria.registrar("Libro", id, activo ? "ACTIVAR" : "DESACTIVAR", // <-- AUDITORÍA
                "Libro " + l.getTitulo(), datos("activo", antes), datos("activo", activo));
        return aResponse(l, stockService.porLibro(l.getLibroId()));
    }

    private void aplicar(Libro l, LibroRequest r, String isbn) {
        l.setIsbn(isbn);
        l.setTitulo(r.titulo().trim());
        l.setCategoria(r.categoriaId() == null ? null : categoriaRepo.findById(r.categoriaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría", r.categoriaId())));
        l.setEditorial(r.editorialId() == null ? null : editorialRepo.findById(r.editorialId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Editorial", r.editorialId())));
        l.setAnioPublicacion(r.anioPublicacion());
        l.setEdicion(r.edicion());
        l.setDescripcion(r.descripcion());
        l.setImagenPortada(r.imagenPortada());
        l.setPrecioVenta(r.precioVenta());
        if (r.prestamoHabilitado() != null) l.setPrestamoHabilitado(r.prestamoHabilitado());
        if (r.ventaHabilitada() != null) l.setVentaHabilitada(r.ventaHabilitada());

        Set<Integer> ids = new LinkedHashSet<>(r.autorIds());
        List<Autor> autores = autorRepo.findAllById(ids);
        if (autores.size() != ids.size())
            throw new RecursoNoEncontradoException("Autor", "alguno de " + ids);
        l.getAutores().clear();
        l.getAutores().addAll(autores);
    }

    private String normalizarIsbn(String isbn) {
        return isbn == null || isbn.isBlank() ? null : isbn.trim();
    }

    private Pageable sanear(Pageable p) {
        int size = Math.min(p.getPageSize(), 50);
        Sort sort = Sort.by(p.getSort().stream()
                .filter(o -> ORDEN_PERMITIDO.contains(o.getProperty())).toList());
        if (sort.isUnsorted()) sort = Sort.by("titulo");
        return PageRequest.of(p.getPageNumber(), size, sort);
    }

    private LibroResponse aResponse(Libro l, StockLibro stock) {
        return new LibroResponse(l.getLibroId(), l.getIsbn(), l.getTitulo(),
                l.getCategoria() == null ? null : new ItemRef(l.getCategoria().getCategoriaId(), l.getCategoria().getNombre()),
                l.getEditorial() == null ? null : new ItemRef(l.getEditorial().getEditorialId(), l.getEditorial().getNombre()),
                l.getAnioPublicacion(), l.getEdicion(), l.getDescripcion(), l.getImagenPortada(),
                l.getPrecioVenta(), l.isPrestamoHabilitado(), l.isVentaHabilitada(), l.isActivo(),
                l.getAutores().stream().map(a -> new ItemRef(a.getAutorId(), a.getNombreCompleto())).toList(),
                stock);
    }

    private Map<String, Object> instantanea(Libro l) {
        return datos("isbn", l.getIsbn(), "titulo", l.getTitulo(), "precioVenta", l.getPrecioVenta(),
                "ventaHabilitada", l.isVentaHabilitada(), "prestamoHabilitado", l.isPrestamoHabilitado(),
                "activo", l.isActivo());
    }
}