package com.example.biblionova.comercio.entity;

import com.example.biblionova.common.pago.MetodoPago;
import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagosPedidos")
@Getter
@Setter
@NoArgsConstructor
public class PagoPedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pagoPedidoId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedidoId", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "metodoPagoId", nullable = false)
    private MetodoPago metodoPago;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoRegistroPago estado = EstadoRegistroPago.Pendiente;

    @Column(length = 150) private String referenciaExterna;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    private LocalDateTime fechaConfirmacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmadoPor")
    private Usuario confirmadoPor;

    @PrePersist
    void antesDeGuardar() { if (fechaRegistro == null) fechaRegistro = LocalDateTime.now(); }
}