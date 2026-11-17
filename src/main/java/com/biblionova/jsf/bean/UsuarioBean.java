package com.biblionova.jsf.bean;

import com.biblionova.jsf.entity.Usuario;
import com.biblionova.jsf.repository.UsuarioRepository;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.util.List;

@Named("usuarioBean")
@RequestScoped
public class UsuarioBean {

    @Inject
    private UsuarioRepository usuarioRepository;

    private Usuario usuario = new Usuario();
    private String mensaje;

    public void guardar() {
        try {
            String codigo = usuario.getCodigo();

            if (codigo == null || codigo.isBlank()) {
                mensaje = "El código universitario es obligatorio.";
                return;
            }

            codigo = codigo.trim();
            usuario.setCodigo(codigo);

            if (usuarioRepository.buscarPorCodigo(codigo) != null) {
                mensaje = "Ya existe un usuario con ese código universitario.";
                return;
            }

            usuario.setActivo(true);

            usuarioRepository.guardar(usuario);

            mensaje = "Usuario registrado correctamente.";
            usuario = new Usuario();

        } catch (Exception e) {
            mensaje = "No se pudo registrar el usuario. Verifica los datos.";
        }
    }

    public List<Usuario> getUsuarios() {
        return usuarioRepository.listar();
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getMensaje() {
        return mensaje;
    }
}
