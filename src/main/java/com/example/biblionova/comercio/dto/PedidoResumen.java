package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.comercio.entity.EstadoPagoPedido;
import com.example.biblionova.comercio.entity.EstadoPedido;
import com.example.biblionova.comercio.entity.TipoEntrega;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PedidoResumen(Long pedidoId, String numeroPedido, ItemRef lector, TipoEntrega tipoEntrega,
                            EstadoPedido estado, EstadoPagoPedido estadoPago, BigDecimal total,
                            LocalDateTime fechaPedido) {}