package com.example.biblionova.seguridad.dto;

import java.util.List;

public record UsuarioResumen(
        Integer usuarioId, String nombreCompleto, String nombreUsuario,
        String correo, String rol, List<String> permisos) {}
