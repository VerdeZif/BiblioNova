package com.example.biblionova.prestamos.entity;

import com.example.biblionova.inventario.entity.Ejemplar;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "detallePrestamos")
@Getter @Setter @NoArgsConstructor // <-- IMPORTANTE: Verifica que estén estas 3 de Lombok
public class DetallePrestamo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer detallePrestamoId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestamoId", nullable = false)
    private Prestamo prestamo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ejemplarId", nullable = false)
    private Ejemplar ejemplar;

    private LocalDateTime fechaDevolucion;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoDetallePrestamo estadoDetalle = EstadoDetallePrestamo.Prestado;

    @Column(length = 500)
    private String observacionDevolucion;
}
