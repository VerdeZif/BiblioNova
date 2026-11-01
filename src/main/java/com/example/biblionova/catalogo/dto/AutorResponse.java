package com.example.biblionova.catalogo.dto;

import java.time.LocalDate;

public record AutorResponse(Integer autorId, String nombres, String apellidos, String nombreCompleto,
                            String nacionalidad, LocalDate fechaNacimiento, String biografia) {}
