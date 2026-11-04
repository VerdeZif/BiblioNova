package com.example.biblionova.comercio.entity;

import com.example.biblionova.prestamos.entity.Lector;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
public class Pedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pedidoId;

    @Column(nullable = false, unique = true, length = 40)
    private String numeroPedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lectorId", nullable = false)
    private Lector lector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direccionId")
    private DireccionEntrega direccion;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TipoEntrega tipoEntrega;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 25)
    private EstadoPedido estado = EstadoPedido.Pendiente;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoPagoPedido estadoPago = EstadoPagoPedido.Pendiente;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaPedido;

    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal impuesto = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal costoEnvio = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal descuento = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal total = BigDecimal.ZERO;

    @Column(length = 500) private String observaciones;

    @PrePersist
    void antesDeGuardar() { if (fechaPedido == null) fechaPedido = LocalDateTime.now(); }
}