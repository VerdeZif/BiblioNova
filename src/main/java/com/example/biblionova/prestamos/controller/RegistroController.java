package com.example.biblionova.prestamos.controller;

import com.example.biblionova.prestamos.dto.LectorResponse;
import com.example.biblionova.prestamos.dto.RegistroClienteRequest;
import com.example.biblionova.prestamos.service.RegistroClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/registro")
@RequiredArgsConstructor
public class RegistroController {
    private final RegistroClienteService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LectorResponse registrar(@Valid @RequestBody RegistroClienteRequest r) {
        return service.registrar(r);
    }
}
