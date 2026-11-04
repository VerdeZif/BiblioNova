package com.example.biblionova.comercio.entity;

import com.example.biblionova.inventario.entity.Ejemplar;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "asignacionesPedido")
@Getter
@Setter
@NoArgsConstructor
public class AsignacionPedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long asignacionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detallePedidoId", nullable = false)
    private DetallePedido detallePedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ejemplarId", nullable = false)
    private Ejemplar ejemplar;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaAsignacion;

    private LocalDateTime fechaLiberacion;

    @PrePersist
    void antesDeGuardar() { if (fechaAsignacion == null) fechaAsignacion = LocalDateTime.now(); }
}