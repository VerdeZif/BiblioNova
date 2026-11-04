package com.example.biblionova.prestamos.entity;

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
@Table(name = "multas")
@Getter @Setter @NoArgsConstructor
public class Multa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer multaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detallePrestamoId", nullable = false)
    private DetallePrestamo detallePrestamo;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TipoMulta tipoMulta;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaGeneracion;

    private int diasRetraso;

    @Column(precision = 10, scale = 2)
    private BigDecimal tarifaAplicada;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoMulta estado = EstadoMulta.Pendiente;

    @Column(length = 500)
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluadaPor")
    private Usuario evaluadaPor;

    private LocalDateTime fechaResolucion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaGeneracion == null) fechaGeneracion = LocalDateTime.now();
    }
}
