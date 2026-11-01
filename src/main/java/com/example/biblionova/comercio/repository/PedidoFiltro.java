package com.example.biblionova.comercio.repository;

import com.example.biblionova.comercio.entity.EstadoPagoPedido;
import com.example.biblionova.comercio.entity.EstadoPedido;
import com.example.biblionova.comercio.entity.TipoEntrega;

public record PedidoFiltro(Integer lectorId, EstadoPedido estado, EstadoPagoPedido estadoPago,
                           TipoEntrega tipoEntrega, String q) {}