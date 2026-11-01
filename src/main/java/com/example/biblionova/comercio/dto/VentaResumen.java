package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.comercio.entity.CanalVenta;
import com.example.biblionova.comercio.entity.EstadoVenta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VentaResumen(Integer ventaId, String numeroVenta, CanalVenta canal, EstadoVenta estado,
                           LocalDateTime fechaVenta, ItemRef lector, BigDecimal total) {}