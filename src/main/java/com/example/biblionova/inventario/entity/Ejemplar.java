package com.example.biblionova.inventario.entity;

import com.example.biblionova.catalogo.entity.Libro;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name = "ejemplares")
@Getter @Setter @NoArgsConstructor
public class Ejemplar {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ejemplarId;

    @Column(nullable = false, unique = true, length = 50)
    private String codigoEjemplar;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "libroId", nullable = false)
    private Libro libro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacionId")
    private Ubicacion ubicacion;

    private LocalDate fechaAdquisicion;
    private BigDecimal costoAdquisicion;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 25)
    private EstadoEjemplar estado = EstadoEjemplar.Disponible;

    private boolean esVendible = true;
    private boolean esPrestamo = true;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 25)
    private CondicionFisica condicionFisica = CondicionFisica.Bueno;

    @Column(length = 500)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detalleRecepcionId")
    private DetalleRecepcion detalleRecepcion;
}
