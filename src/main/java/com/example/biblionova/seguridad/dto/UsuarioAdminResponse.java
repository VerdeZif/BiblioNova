package com.example.biblionova.seguridad.dto;

import java.time.LocalDateTime;

public record UsuarioAdminResponse(Integer usuarioId, String nombreUsuario, String nombreCompleto,
                                   String correo, String rol, boolean activo,
                                   LocalDateTime fechaCreacion, LocalDateTime ultimoAcceso) {}