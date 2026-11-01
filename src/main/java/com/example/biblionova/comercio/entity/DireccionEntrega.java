package com.example.biblionova.comercio.entity;

import com.example.biblionova.prestamos.entity.Lector;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "direccionesEntrega")
@Getter
@Setter
@NoArgsConstructor
public class DireccionEntrega {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long direccionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lectorId", nullable = false)
    private Lector lector;

    @Column(nullable = false, length = 150) private String destinatario;
    @Column(nullable = false, length = 25) private String telefono;
    @Column(length = 100) private String departamento;
    @Column(length = 100) private String provincia;
    @Column(nullable = false, length = 100) private String distrito;
    @Column(nullable = false, length = 250) private String direccion;
    @Column(length = 250) private String referencia;
    private boolean predeterminada;
}