package com.example.biblionova.auditoria.service;

import com.example.biblionova.auditoria.dto.AuditoriaFiltro;
import com.example.biblionova.auditoria.dto.EventoDetalle;
import com.example.biblionova.auditoria.dto.EventoResumen;
import com.example.biblionova.auditoria.entity.AuditoriaEvento;
import com.example.biblionova.auditoria.repository.AuditoriaEventoRepository;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private static final List<String> SENSIBLES = List.of("contrasena", "password", "hash", "token", "secret", "clave");
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final AuditoriaEventoRepository repo;
    private final UsuarioRepository usuarioRepo;

    /** Arma un mapa clave-valor permitiendo nulos: datos("estado", x, "monto", y). */
    public static Map<String, Object> datos(Object... paresClaveValor) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < paresClaveValor.length; i += 2)
            m.put(String.valueOf(paresClaveValor[i]), paresClaveValor[i + 1]);
        return m;
    }

    /** Se une a la transacción de quien lo llama (o abre una propia si no hay). Usa el usuario autenticado. */
    @Transactional
    public void registrar(String entidad, Object entidadId, String accion, String descripcion,
                          Object antes, Object despues) {
        registrarComo(usuarioAutenticado(), entidad, entidadId, accion, descripcion, antes, despues);
    }

    @Transactional
    public void registrarComo(Usuario usuario, String entidad, Object entidadId, String accion,
                              String descripcion, Object antes, Object despues) {
        AuditoriaEvento e = new AuditoriaEvento();
        e.setUsuario(usuario);
        e.setEntidad(recortar(entidad, 80));
        e.setEntidadId(entidadId == null ? null : recortar(String.valueOf(entidadId), 80));
        e.setAccion(recortar(accion, 80));
        e.setDescripcion(descripcion == null ? null : recortar(descripcion, 500));
        e.setDatosAntes(aMapa(antes));
        e.setDatosDespues(aMapa(despues));
        e.setDireccionIp(ipActual());
        repo.save(e);
    }

    // ---------------------------------------------------------------- consulta (solo Administrador)

    @Transactional(readOnly = true)
    public PageResponse<EventoResumen> buscar(AuditoriaFiltro f, Pageable pageable) {
        Specification<AuditoriaEvento> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.entidad() != null && !f.entidad().isBlank()) p.add(cb.equal(root.get("entidad"), f.entidad().trim()));
            if (f.entidadId() != null && !f.entidadId().isBlank()) p.add(cb.equal(root.get("entidadId"), f.entidadId().trim()));
            if (f.accion() != null && !f.accion().isBlank()) p.add(cb.equal(root.get("accion"), f.accion().trim()));
            if (f.usuario() != null && !f.usuario().isBlank()) {
                Join<AuditoriaEvento, Usuario> u = root.join("usuario", JoinType.LEFT);
                p.add(cb.like(cb.lower(u.get("nombreUsuario")), "%" + f.usuario().trim().toLowerCase() + "%"));
            }
            if (f.desde() != null)
                p.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fechaEvento"), f.desde().atStartOfDay()));
            if (f.hasta() != null)
                p.add(cb.lessThan(root.<LocalDateTime>get("fechaEvento"), f.hasta().plusDays(1).atStartOfDay()));
            if (f.q() != null && !f.q().isBlank())
                p.add(cb.like(cb.lower(root.get("descripcion")), "%" + f.q().trim().toLowerCase() + "%"));
            return cb.and(p.toArray(Predicate[]::new));
        };
        Pageable pg = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100),
                Sort.by(Sort.Direction.DESC, "fechaEvento", "eventoId"));
        return PageResponse.de(repo.findAll(spec, pg).map(e -> new EventoResumen(e.getEventoId(), e.getFechaEvento(),
                nombre(e), e.getEntidad(), e.getEntidadId(), e.getAccion(), e.getDescripcion())));
    }

    @Transactional(readOnly = true)
    public EventoDetalle obtener(Long id) {
        AuditoriaEvento e = repo.findWithUsuarioByEventoId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Evento de auditoría", id));
        return new EventoDetalle(e.getEventoId(), e.getFechaEvento(), nombre(e), e.getEntidad(), e.getEntidadId(),
                e.getAccion(), e.getDescripcion(), e.getDatosAntes(), e.getDatosDespues(), e.getDireccionIp());
    }

    // ---------------------------------------------------------------- internos

    private String nombre(AuditoriaEvento e) {
        return e.getUsuario() == null ? null : e.getUsuario().getNombreUsuario();
    }

    private Usuario usuarioAutenticado() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || a instanceof AnonymousAuthenticationToken) return null;
        return usuarioRepo.findByNombreUsuario(a.getName()).orElse(null);
    }

    /** Se usa getRemoteAddr y no X-Forwarded-For: ese encabezado lo puede falsificar cualquiera. */
    private String ipActual() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes sra)
            return recortar(sra.getRequest().getRemoteAddr(), 45);
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> aMapa(Object o) {
        if (o == null) return null;
        Map<String, Object> mapa;
        try {
            mapa = MAPPER.convertValue(o, Map.class);     // deja solo tipos JSON simples (fechas, enums, decimales)
        } catch (RuntimeException e) {
            mapa = datos("valor", String.valueOf(o));
        }
        limpiar(mapa);
        return mapa.toString().length() > 30_000 ? datos("truncado", true) : mapa;
    }

    /** Defensa extra (nota 7 del SQL): quita cualquier campo con nombre de secreto, a cualquier profundidad. */
    private void limpiar(Object nodo) {
        if (nodo instanceof Map<?, ?> m) {
            m.keySet().removeIf(k -> {
                String minus = String.valueOf(k).toLowerCase();
                return SENSIBLES.stream().anyMatch(minus::contains);
            });
            m.values().forEach(this::limpiar);
        } else if (nodo instanceof Collection<?> c) {
            c.forEach(this::limpiar);
        }
    }

    private static String recortar(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}