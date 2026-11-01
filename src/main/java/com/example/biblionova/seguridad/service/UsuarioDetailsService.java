package com.example.biblionova.seguridad.service;

import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        Usuario u = usuarioRepository.buscarConRol(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        List<GrantedAuthority> autoridades = new ArrayList<>();
        autoridades.add(new SimpleGrantedAuthority("ROLE_" + u.getRol().getNombre().toUpperCase()));
        u.getRol().getPermisos()
                .forEach(p -> autoridades.add(new SimpleGrantedAuthority(p.getCodigo())));

        return User.withUsername(u.getNombreUsuario())
                .password(u.getHashContrasena())
                .authorities(autoridades)
                .disabled(!u.isActivo())
                .build();
    }
}
