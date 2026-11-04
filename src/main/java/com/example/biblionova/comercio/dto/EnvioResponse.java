package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.EstadoEnvio;

import java.time.LocalDateTime;

public record EnvioResponse(EstadoEnvio estado, String operador, String codigoSeguimiento,
                            LocalDateTime fechaPreparacion, LocalDateTime fechaDespacho,
                            LocalDateTime fechaEntrega, String recibidoPor) {}