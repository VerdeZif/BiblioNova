package com.example.biblionova.seguridad.service;

import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UsuarioActual {
    private final UsuarioRepository repo;

    public Usuario obtener() {
        String nombre = SecurityContextHolder.getContext().getAuthentication().getName();
        return repo.findByNombreUsuario(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", nombre));
    }

    public Usuario sistema() {
        return repo.findByNombreUsuario("sistema")
                .orElseThrow(() -> new IllegalStateException("Falta el usuario 'sistema' (revisa DataInitializer)"));
    }

}
