package com.example.biblionova.prestamos.dto;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public record ArchivoEvidencia(Resource recurso, MediaType tipo) {}
