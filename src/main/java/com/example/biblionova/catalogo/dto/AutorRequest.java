package com.example.biblionova.catalogo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record AutorRequest(@NotBlank @Size(max = 100) String nombres, @Size(max = 100) String apellidos,
                           @Size(max = 80) String nacionalidad, @Past LocalDate fechaNacimiento,
                           String biografia) {}
