package com.example.biblionova.comercio.entity;

import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "ventas")
@Getter
@Setter
@NoArgsConstructor
public class Venta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ventaId;

    @Column(nullable = false, unique = true, length = 30)
    private String numeroVenta;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedidoId")
    private Pedido pedido;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CanalVenta canal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lectorId")
    private Lector lector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuarioId")
    private Usuario usuario;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaVenta;

    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal impuesto = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal descuento = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoVenta estado = EstadoVenta.Pendiente;

    @Column(length = 30) private String tipoComprobante;
    @Column(length = 40) private String numeroComprobante;
    @Column(length = 500) private String observaciones;

    @PrePersist
    void antesDeGuardar() { if (fechaVenta == null) fechaVenta = LocalDateTime.now(); }
}