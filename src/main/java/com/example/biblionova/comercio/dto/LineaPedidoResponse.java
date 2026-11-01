package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;

import java.math.BigDecimal;
import java.util.List;

public record LineaPedidoResponse(Long detallePedidoId, ItemRef libro, int cantidad, BigDecimal precioUnitario,
                                  BigDecimal importe, List<String> ejemplares) {}