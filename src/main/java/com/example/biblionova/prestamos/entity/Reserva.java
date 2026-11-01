package com.example.biblionova.prestamos.entity;

import com.example.biblionova.catalogo.entity.Libro;
import com.example.biblionova.inventario.entity.Ejemplar;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
@Getter @Setter @NoArgsConstructor
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lectorId", nullable = false)
    private Lector lector;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "libroId", nullable = false)
    private Libro libro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ejemplarId")
    private Ejemplar ejemplar;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaSolicitud;

    private LocalDateTime fechaExpiracion;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoReserva estado = EstadoReserva.Pendiente;

    @Column(length = 500) private String observaciones;

    @PrePersist
    void antesDeGuardar() {
        if (fechaSolicitud == null) fechaSolicitud = LocalDateTime.now();
    }
}
