package com.example.biblionova.prestamos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "detalleDevoluciones")
@Getter @Setter @NoArgsConstructor // <-- IMPORTANTE: Verifica que estén estas 3 de Lombok
public class DetalleDevolucion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detalleDevolucionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devolucionId", nullable = false)
    private Devolucion devolucion;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detallePrestamoId", nullable = false)
    private DetallePrestamo detallePrestamo;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CondicionRecibida condicionRecibida;

    @Column(length = 500)
    private String observaciones;

    private boolean requiereEvaluacion;
}
