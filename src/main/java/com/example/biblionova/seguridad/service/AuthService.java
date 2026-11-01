package com.example.biblionova.seguridad.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import com.example.biblionova.seguridad.dto.CambiarContrasenaRequest;
import com.example.biblionova.seguridad.dto.LoginRequest;
import com.example.biblionova.seguridad.dto.LoginResponse;
import com.example.biblionova.seguridad.dto.UsuarioResumen;
import com.example.biblionova.seguridad.entity.Permiso;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoria;

    public LoginResponse login(LoginRequest req) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.usuario(), req.contrasena()));
        } catch (AuthenticationException e) {
            String intento = req.usuario().length() > 50 ? req.usuario().substring(0, 50) : req.usuario();
            auditoria.registrar("Usuario", intento, "LOGIN_FALLIDO",
                    "Inicio de sesión fallido para '" + intento + "'", null, null);
            throw e;
        }
        UserDetails ud = (UserDetails) auth.getPrincipal();
        Usuario u = usuarioRepository.buscarConRol(ud.getUsername()).orElseThrow();
        usuarioRepository.registrarAcceso(u.getUsuarioId(), LocalDateTime.now());
        auditoria.registrarComo(u, "Usuario", u.getUsuarioId(), "LOGIN_OK", "Inicio de sesión", null, null);

        return new LoginResponse(jwtService.generar(ud), "Bearer", jwtService.getExpiracionMinutos(), resumen(u));
    }

    @Transactional(readOnly = true)
    public UsuarioResumen perfil(String nombreUsuario) {
        return resumen(usuarioRepository.buscarConRol(nombreUsuario).orElseThrow());
    }

    @Transactional
    public void cambiarContrasena(String nombreUsuario, CambiarContrasenaRequest r) {
        Usuario u = usuarioRepository.findByNombreUsuario(nombreUsuario).orElseThrow();
        if (!passwordEncoder.matches(r.contrasenaActual(), u.getHashContrasena()))
            throw new SolicitudInvalidaException("La contraseña actual no es correcta");
        if (passwordEncoder.matches(r.contrasenaNueva(), u.getHashContrasena()))
            throw new SolicitudInvalidaException("La contraseña nueva debe ser distinta de la actual");
        u.setHashContrasena(passwordEncoder.encode(r.contrasenaNueva()));
        auditoria.registrarComo(u, "Usuario", u.getUsuarioId(), "CAMBIAR_CONTRASENA",
                "El usuario cambió su contraseña", null, null);
    }

    private UsuarioResumen resumen(Usuario u) {
        return new UsuarioResumen(u.getUsuarioId(), u.getNombreCompleto(), u.getNombreUsuario(),
                u.getCorreo(), u.getRol().getNombre(),
                u.getRol().getPermisos().stream().map(Permiso::getCodigo).toList());
    }
}