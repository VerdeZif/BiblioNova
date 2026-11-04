package com.example.biblionova.comercio.dto;

import jakarta.validation.constraints.Size;

public record ConfirmarPagoRequest(@Size(max = 150) String referenciaExterna) {}