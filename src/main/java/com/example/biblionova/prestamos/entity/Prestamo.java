package com.example.biblionova.prestamos.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "prestamos")
@Getter @Setter @NoArgsConstructor
public class Prestamo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer prestamoId;

    @Column(nullable = false, unique = true, length = 30)
    private String codigoPrestamo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lectorId", nullable = false)
    private Lector lector;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuarioId", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "politicaId", nullable = false)
    private PoliticaPrestamo politica;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaPrestamo;

    @Column(nullable = false)
    private LocalDate fechaVencimiento;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EstadoPrestamo estado = EstadoPrestamo.Activo;

    @Column(length = 500)
    private String observaciones;

    @PrePersist
    void antesDeGuardar() {
        if (fechaPrestamo == null) fechaPrestamo = LocalDateTime.now();
    }

    public boolean estaPendiente() {
        return estado == EstadoPrestamo.Activo || estado == EstadoPrestamo.Parcial;
    }

    /** días de retraso = máximo(0, fecha − vencimiento), la fórmula del documento */
    public int diasRetraso(LocalDate fecha) {
        return (int) Math.max(0, ChronoUnit.DAYS.between(fechaVencimiento, fecha));
    }
}
