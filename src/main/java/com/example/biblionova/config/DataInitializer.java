package com.example.biblionova.config;

import com.example.biblionova.seguridad.entity.Rol;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.RolRepository;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.nombre-usuario}") private String nombreUsuario;
    @Value("${app.admin.correo}") private String correo;
    @Value("${app.admin.contrasena:}") private String contrasena;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        crearAdminInicial();
        asegurarUsuarioSistema();
    }

    private void crearAdminInicial() {
        if (usuarioRepository.countByNombreUsuarioNot("sistema") > 0) return;
        if (contrasena.isBlank()) {
            log.warn("No hay usuarios y ADMIN_PASSWORD está vacío: no se creó el administrador inicial.");
            return;
        }
        Rol rol = rolRepository.findByNombre("Administrador").orElseThrow();
        Usuario admin = new Usuario();
        admin.setRol(rol);
        admin.setNombreCompleto("Administrador del sistema");
        admin.setNombreUsuario(nombreUsuario);
        admin.setCorreo(correo);
        admin.setHashContrasena(passwordEncoder.encode(contrasena));
        usuarioRepository.save(admin);
        log.info("Administrador inicial '{}' creado.", nombreUsuario);
    }

    private void asegurarUsuarioSistema() {
        if (usuarioRepository.existsByNombreUsuario("sistema")) return;
        Usuario s = new Usuario();
        s.setRol(rolRepository.findByNombre("Administrador").orElseThrow());
        s.setNombreCompleto("Procesos automáticos del sistema");
        s.setNombreUsuario("sistema");
        s.setCorreo("sistema@biblionova.local");
        s.setHashContrasena(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        s.setActivo(false);
        usuarioRepository.save(s);
    }

}
