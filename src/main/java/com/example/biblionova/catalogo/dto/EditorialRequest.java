package com.example.biblionova.catalogo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditorialRequest(@NotBlank @Size(max = 150) String nombre,
                               @Size(max = 80) String pais, @Size(max = 250) String sitioWeb) {}
