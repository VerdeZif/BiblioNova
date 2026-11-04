package com.example.biblionova.prestamos.dto;

import java.time.LocalDate;

public record LectorResponse(Integer lectorId, Integer usuarioId, String documento, String nombres,
                             String apellidos, String nombreCompleto, String correo, String telefono,
                             String direccion, LocalDate fechaRegistro, boolean activo) {}
