package com.example.biblionova.prestamos.entity;

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
@Table(name = "pagosMultas")
@Getter @Setter @NoArgsConstructor
public class PagoMulta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pagoMultaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "multaId", nullable = false)
    private Multa multa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "metodoPagoId", nullable = false)
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuarioId", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaPago;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montoPagado;

    @Column(length = 100)
    private String referenciaPago;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoPagoMulta estado = EstadoPagoMulta.Confirmado;

    @PrePersist
    void antesDeGuardar() {
        if (fechaPago == null) fechaPago = LocalDateTime.now();
    }
}
