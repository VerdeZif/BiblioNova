package com.example.biblionova.seguridad.controller;

import com.example.biblionova.seguridad.dto.CambiarContrasenaRequest;
import com.example.biblionova.seguridad.dto.LoginRequest;
import com.example.biblionova.seguridad.dto.LoginResponse;
import com.example.biblionova.seguridad.dto.UsuarioResumen;
import com.example.biblionova.seguridad.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UsuarioResumen me(Authentication auth) {
        return authService.perfil(auth.getName());
    }

    @PostMapping("/cambiar-contrasena") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarContrasena(Authentication auth, @Valid @RequestBody CambiarContrasenaRequest r) {
        authService.cambiarContrasena(auth.getName(), r);
    }

}
