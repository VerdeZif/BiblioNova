package com.example.biblionova.comercio.entity;

import com.example.biblionova.catalogo.entity.Libro;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "detallePedidos")
@Getter
@Setter
@NoArgsConstructor
public class DetallePedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detallePedidoId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedidoId", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "libroId", nullable = false)
    private Libro libro;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;       // precio del libro al momento de comprar (no cambia después)

    @Column(insertable = false, updatable = false)   // columna generada por MySQL
    private BigDecimal importe;
}