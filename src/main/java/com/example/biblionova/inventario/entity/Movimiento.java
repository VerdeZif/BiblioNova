package com.example.biblionova.inventario.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity @Table(name = "movimientosInventario")
@Getter @Setter @NoArgsConstructor
public class Movimiento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long movimientoId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ejemplarId", nullable = false)
    private Ejemplar ejemplar;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuarioId", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 35)
    private TipoMovimiento tipoMovimiento;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 25)
    private EstadoEjemplar estadoAnterior;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 25)
    private EstadoEjemplar estadoNuevo;

    @Column(length = 40) private String referenciaTipo;
    private Long referenciaId;
    @Column(length = 500) private String motivo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaMovimiento;

    @PrePersist
    void antesDeGuardar() { if (fechaMovimiento == null) fechaMovimiento = LocalDateTime.now(); }
}
