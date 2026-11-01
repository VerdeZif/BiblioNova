package com.example.biblionova.prestamos.service;

import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.prestamos.dto.LectorResponse;
import com.example.biblionova.prestamos.dto.RegistroClienteRequest;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.seguridad.entity.Rol;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.RolRepository;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.biblionova.auditoria.service.AuditoriaService;
import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class RegistroClienteService {
    private final UsuarioRepository usuarioRepo;
    private final RolRepository rolRepo;
    private final LectorRepository lectorRepo;
    private final PasswordEncoder passwordEncoder;
    private final LectorService lectorService;
    private final AuditoriaService auditoria;

    @Transactional
    public LectorResponse registrar(RegistroClienteRequest r) {
        String nombreUsuario = r.nombreUsuario().trim();
        String correo = r.correo().trim().toLowerCase();
        String documento = r.documento().trim();

        if (usuarioRepo.existsByNombreUsuario(nombreUsuario))
            throw new ConflictoException("Ese nombre de usuario no está disponible");
        if (usuarioRepo.existsByCorreo(correo))
            throw new ConflictoException("Ya existe una cuenta con ese correo");
        if (lectorRepo.existsByDocumento(documento))
            throw new ConflictoException("Ese documento ya está registrado. Si ya eres lector, acércate al mostrador para vincular tu cuenta");

        Rol rol = rolRepo.findByNombre("Cliente")
                .orElseThrow(() -> new IllegalStateException("Falta el rol Cliente en la base de datos"));

        Usuario u = new Usuario();
        u.setRol(rol);
        u.setNombreCompleto(r.nombres().trim() + " " + r.apellidos().trim());
        u.setNombreUsuario(nombreUsuario);
        u.setCorreo(correo);
        u.setHashContrasena(passwordEncoder.encode(r.contrasena()));
        usuarioRepo.save(u);

        Lector l = new Lector();
        l.setUsuario(u);
        l.setDocumento(documento);
        l.setNombres(r.nombres().trim());
        l.setApellidos(r.apellidos().trim());
        l.setCorreo(correo);
        l.setTelefono(r.telefono());
        l.setDireccion(r.direccion());
        Lector guardado = lectorRepo.save(l);
        auditoria.registrarComo(u, "Usuario", u.getUsuarioId(), "REGISTRO_CLIENTE",
                "Registro público de cliente " + nombreUsuario, null, datos("lectorId", guardado.getLectorId()));
        return lectorService.aResponse(guardado);
    }
}