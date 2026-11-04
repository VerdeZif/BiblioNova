package com.example.biblionova.comercio.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.comercio.entity.CanalVenta;
import com.example.biblionova.comercio.entity.EstadoVenta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VentaResponse(Integer ventaId, String numeroVenta, CanalVenta canal, EstadoVenta estado,
                            LocalDateTime fechaVenta, ItemRef lector, Long pedidoId, String numeroPedido,
                            String atendidoPor, BigDecimal subtotal, BigDecimal impuesto, BigDecimal descuento,
                            BigDecimal total, String tipoComprobante, String numeroComprobante,
                            String observaciones, List<LineaVentaResponse> lineas,
                            List<PagoVentaResponse> pagos, BigDecimal vuelto) {}