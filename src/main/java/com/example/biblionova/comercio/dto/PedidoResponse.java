package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.comercio.entity.EstadoPagoPedido;
import com.example.biblionova.comercio.entity.EstadoPedido;
import com.example.biblionova.comercio.entity.TipoEntrega;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(Long pedidoId, String numeroPedido, ItemRef lector, TipoEntrega tipoEntrega,
                             EstadoPedido estado, EstadoPagoPedido estadoPago, LocalDateTime fechaPedido,
                             BigDecimal subtotal, BigDecimal impuesto, BigDecimal costoEnvio,
                             BigDecimal descuento, BigDecimal total, String observaciones,
                             DireccionResponse direccion, String puntoRecojo, LocalDateTime plazoRecojo,
                             boolean plazoRecojoVencido, List<LineaPedidoResponse> lineas,
                             List<PagoPedidoResponse> pagos, EnvioResponse envio) {}