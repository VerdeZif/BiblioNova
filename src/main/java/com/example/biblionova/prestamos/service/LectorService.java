package com.example.biblionova.prestamos.service;

import com.example.biblionova.auditoria.service.AuditoriaService;          // <-- AUDITORÍA
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.prestamos.dto.LectorRequest;
import com.example.biblionova.prestamos.dto.LectorResponse;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;   // <-- AUDITORÍA

@Service
@RequiredArgsConstructor
public class LectorService {
    private final LectorRepository repo;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;                               // <-- AUDITORÍA

    @Transactional(readOnly = true)
    public PageResponse<LectorResponse> buscar(String q, Pageable pageable) {
        Pageable p = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50),
                Sort.by("apellidos", "nombres"));
        String like = "%" + (q == null ? "" : q.trim().toLowerCase()) + "%";
        return PageResponse.de(repo.buscar(like, p).map(this::aResponse));
    }

    @Transactional(readOnly = true)
    public LectorResponse obtener(Integer id) {
        return aResponse(repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Lector", id)));
    }

    @Transactional(readOnly = true)
    public LectorResponse delUsuarioActual() {
        Usuario u = usuarioActual.obtener();
        return aResponse(repo.findByUsuario_UsuarioId(u.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario())));
    }

    @Transactional
    public LectorResponse crear(LectorRequest r) {
        String documento = r.documento().trim();
        if (repo.existsByDocumento(documento)) throw new ConflictoException("Ya existe un lector con ese documento");
        Lector l = new Lector();
        copiar(l, r, documento);
        return aResponse(repo.save(l));
    }

    @Transactional
    public LectorResponse actualizar(Integer id, LectorRequest r) {
        Lector l = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Lector", id));
        String documento = r.documento().trim();
        if (repo.existsByDocumentoAndLectorIdNot(documento, id))
            throw new ConflictoException("Ya existe otro lector con ese documento");
        copiar(l, r, documento);
        return aResponse(l);
    }

    @Transactional
    public LectorResponse cambiarActivo(Integer id, boolean activo) {
        Lector l = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Lector", id));
        boolean antes = l.isActivo();                                       // <-- AUDITORÍA (valor anterior)
        l.setActivo(activo);
        auditoria.registrar("Lector", id, activo ? "ACTIVAR" : "DESACTIVAR",   // <-- AUDITORÍA
                "Lector " + id, datos("activo", antes), datos("activo", activo));
        return aResponse(l);
    }

    private void copiar(Lector l, LectorRequest r, String documento) {
        l.setDocumento(documento);
        l.setNombres(r.nombres().trim());
        l.setApellidos(r.apellidos().trim());
        l.setCorreo(r.correo() == null || r.correo().isBlank() ? null : r.correo().trim());
        l.setTelefono(r.telefono());
        l.setDireccion(r.direccion());
    }

    public LectorResponse aResponse(Lector l) {
        return new LectorResponse(l.getLectorId(),
                l.getUsuario() == null ? null : l.getUsuario().getUsuarioId(),
                l.getDocumento(), l.getNombres(), l.getApellidos(), l.getNombreCompleto(),
                l.getCorreo(), l.getTelefono(), l.getDireccion(), l.getFechaRegistro(), l.isActivo());
    }
}