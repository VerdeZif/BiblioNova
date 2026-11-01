package com.example.biblionova.seguridad.controller;

import com.example.biblionova.common.util.PageResponse;
import com.example.biblionova.seguridad.dto.*;
import com.example.biblionova.seguridad.service.UsuarioAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seguridad")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioAdminController {
    private final UsuarioAdminService service;

    @GetMapping("/usuarios")
    public PageResponse<UsuarioAdminResponse> buscar(@RequestParam(required = false) String q,
                                                     @RequestParam(required = false) String rol,
                                                     @RequestParam(required = false) Boolean activo,
                                                     @PageableDefault(size = 20) Pageable pageable) {
        return service.buscar(q, rol, activo, pageable);
    }

    @GetMapping("/roles")
    public List<RolResponse> roles() { return service.roles(); }

    @PostMapping("/usuarios") @ResponseStatus(HttpStatus.CREATED)
    public UsuarioAdminResponse crear(@Valid @RequestBody UsuarioCrearRequest r) { return service.crear(r); }

    @PutMapping("/usuarios/{id}")
    public UsuarioAdminResponse actualizar(@PathVariable Integer id, @Valid @RequestBody UsuarioActualizarRequest r) {
        return service.actualizar(id, r);
    }

    @PatchMapping("/usuarios/{id}/activo")
    public UsuarioAdminResponse cambiarActivo(@PathVariable Integer id, @RequestParam boolean valor) {
        return service.cambiarActivo(id, valor);
    }

    @PostMapping("/usuarios/{id}/contrasena") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restablecer(@PathVariable Integer id, @Valid @RequestBody RestablecerContrasenaRequest r) {
        service.restablecerContrasena(id, r);
    }
}