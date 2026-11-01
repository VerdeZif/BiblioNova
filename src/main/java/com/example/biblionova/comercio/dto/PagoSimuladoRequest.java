package com.example.biblionova.comercio.dto;

import jakarta.validation.constraints.NotNull;

public record PagoSimuladoRequest(@NotNull ResultadoPagoSimulado resultado) {}