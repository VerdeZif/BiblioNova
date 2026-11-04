package com.example.biblionova.inventario.entity;

import com.example.biblionova.catalogo.entity.Libro;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity @Table(name = "detalleRecepciones")
@Getter @Setter @NoArgsConstructor
public class DetalleRecepcion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detalleRecepcionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recepcionId", nullable = false)
    private Recepcion recepcion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "libroId", nullable = false)
    private Libro libro;

    @Column(nullable = false)
    private int cantidad;

    private BigDecimal costoUnitario;
}
