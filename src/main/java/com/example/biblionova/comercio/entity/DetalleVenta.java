package com.example.biblionova.comercio.entity;

import com.example.biblionova.inventario.entity.Ejemplar;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "detalleVentas")
@Getter
@Setter
@NoArgsConstructor
public class DetalleVenta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detalleVentaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ventaId", nullable = false)
    private Venta venta;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ejemplarId", nullable = false)
    private Ejemplar ejemplar;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false)
    private int cantidad = 1;                      // el CHECK de tu SQL exige 1 por fila

    @Column(insertable = false, updatable = false)  // columna generada por MySQL
    private BigDecimal importe;
}