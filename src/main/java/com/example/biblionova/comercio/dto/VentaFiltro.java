package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.CanalVenta;
import com.example.biblionova.comercio.entity.EstadoVenta;

import java.time.LocalDate;

public record VentaFiltro(CanalVenta canal, EstadoVenta estado, Integer lectorId,
                          LocalDate desde, LocalDate hasta, String q) {}