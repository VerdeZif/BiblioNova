package com.example.biblionova.seguridad.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.seguridad.dto.*;
import com.example.biblionova.seguridad.entity.Rol;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.RolRepository;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class UsuarioAdminService {

    private static final String SISTEMA = "sistema";
    private static final Set<String> ROLES_PERSONAL = Set.of("Administrador", "Bibliotecario", "Vendedor");

    private final UsuarioRepository usuarioRepo;
    private final RolRepository rolRepo;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public PageResponse<UsuarioAdminResponse> buscar(String q, String rol, Boolean activo, Pageable pageable) {
        Specification<Usuario> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.notEqual(root.get("nombreUsuario"), SISTEMA));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("nombreUsuario")), like),
                        cb.like(cb.lower(root.get("nombreCompleto")), like),
                        cb.like(cb.lower(root.get("correo")), like)));
            }
            if (rol != null && !rol.isBlank()) p.add(cb.equal(root.get("rol").get("nombre"), rol));
            if (activo != null) p.add(cb.equal(root.get("activo"), activo));
            return cb.and(p.toArray(Predicate[]::new));
        };
        Pageable pg = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50),
                Sort.by("nombreUsuario"));
        return PageResponse.de(usuarioRepo.findAll(spec, pg).map(this::aResponse));
    }

    @Transactional(readOnly = true)
    public List<RolResponse> roles() {
        return rolRepo.findAllByOrderByNombre().stream()
                .filter(r -> ROLES_PERSONAL.contains(r.getNombre()))
                .map(r -> new RolResponse(r.getRolId(), r.getNombre(), r.getDescripcion())).toList();
    }

    @Transactional
    public UsuarioAdminResponse crear(UsuarioCrearRequest r) {
        Rol rol = rolDePersonal(r.rol());
        String nombreUsuario = r.nombreUsuario().trim();
        String correo = r.correo().trim().toLowerCase();
        if (SISTEMA.equalsIgnoreCase(nombreUsuario) || usuarioRepo.existsByNombreUsuario(nombreUsuario))
            throw new ConflictoException("Ese nombre de usuario no está disponible");
        if (usuarioRepo.existsByCorreo(correo))
            throw new ConflictoException("Ya existe una cuenta con ese correo");

        Usuario u = new Usuario();
        u.setRol(rol);
        u.setNombreCompleto(r.nombreCompleto().trim());
        u.setNombreUsuario(nombreUsuario);
        u.setCorreo(correo);
        u.setHashContrasena(passwordEncoder.encode(r.contrasena()));
        usuarioRepo.save(u);

        auditoria.registrar("Usuario", u.getUsuarioId(), "CREAR_USUARIO",
                "Usuario creado: %s (%s)".formatted(nombreUsuario, rol.getNombre()), null,
                datos("nombreUsuario", nombreUsuario, "rol", rol.getNombre()));
        return aResponse(u);
    }

    @Transactional
    public UsuarioAdminResponse actualizar(Integer id, UsuarioActualizarRequest r) {
        Usuario u = cargar(id);
        String rolActual = u.getRol().getNombre();
        boolean esCliente = "Cliente".equals(rolActual);
        if (esCliente && !"Cliente".equals(r.rol()))
            throw new ConflictoException("Una cuenta de cliente no puede cambiar de rol");
        Rol rolNuevo = esCliente ? u.getRol() : rolDePersonal(r.rol());

        String correo = r.correo().trim().toLowerCase();
        if (usuarioRepo.existsByCorreoAndUsuarioIdNot(correo, id))
            throw new ConflictoException("Ya existe una cuenta con ese correo");

        boolean cambiaRol = !rolActual.equals(rolNuevo.getNombre());
        if (cambiaRol) {
            if (usuarioActual.obtener().getUsuarioId().equals(id))
                throw new ConflictoException("No puedes cambiar tu propio rol");
            if ("Administrador".equals(rolActual)) exigirOtroAdministrador(u);
        }

        Map<String, Object> antes = datos("nombreCompleto", u.getNombreCompleto(), "rol", rolActual);
        u.setNombreCompleto(r.nombreCompleto().trim());
        u.setCorreo(correo);
        u.setRol(rolNuevo);
        auditoria.registrar("Usuario", id, cambiaRol ? "CAMBIAR_ROL" : "ACTUALIZAR_USUARIO",
                "Usuario " + u.getNombreUsuario(), antes,
                datos("nombreCompleto", u.getNombreCompleto(), "rol", rolNuevo.getNombre()));
        return aResponse(u);
    }

    @Transactional
    public UsuarioAdminResponse cambiarActivo(Integer id, boolean activo) {
        Usuario u = cargar(id);
        if (u.isActivo() == activo) return aResponse(u);
        if (!activo) {
            if (usuarioActual.obtener().getUsuarioId().equals(id))
                throw new ConflictoException("No puedes desactivar tu propia cuenta");
            if ("Administrador".equals(u.getRol().getNombre())) exigirOtroAdministrador(u);
        }
        u.setActivo(activo);
        auditoria.registrar("Usuario", id, activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
                "Usuario " + u.getNombreUsuario(), datos("activo", !activo), datos("activo", activo));
        return aResponse(u);
    }

    @Transactional
    public void restablecerContrasena(Integer id, RestablecerContrasenaRequest r) {
        Usuario u = cargar(id);
        u.setHashContrasena(passwordEncoder.encode(r.contrasenaNueva()));
        auditoria.registrar("Usuario", id, "RESTABLECER_CONTRASENA",
                "Contraseña restablecida por un administrador para " + u.getNombreUsuario(), null, null);
    }

    // ---------------------------------------------------------------- internos

    private Usuario cargar(Integer id) {
        return usuarioRepo.findById(id).filter(x -> !SISTEMA.equals(x.getNombreUsuario()))
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
    }

    private Rol rolDePersonal(String nombre) {
        if (!ROLES_PERSONAL.contains(nombre))
            throw new SolicitudInvalidaException("Rol inválido; los permitidos son: " + ROLES_PERSONAL);
        return rolRepo.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Rol", nombre));
    }

    private void exigirOtroAdministrador(Usuario u) {
        if (u.isActivo() && usuarioRepo.countByRol_NombreAndActivoTrue("Administrador") <= 1)
            throw new ConflictoException("Debe quedar al menos un administrador activo");
    }

    private UsuarioAdminResponse aResponse(Usuario u) {
        return new UsuarioAdminResponse(u.getUsuarioId(), u.getNombreUsuario(), u.getNombreCompleto(),
                u.getCorreo(), u.getRol().getNombre(), u.isActivo(), u.getFechaCreacion(), u.getUltimoAcceso());
    }
}