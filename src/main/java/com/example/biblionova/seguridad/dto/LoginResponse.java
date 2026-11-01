package com.example.biblionova.seguridad.dto;

public record LoginResponse(
        String token, String tipo, long expiraEnMinutos, UsuarioResumen usuario) {}
