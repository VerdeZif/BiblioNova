package com.example.biblionova.prestamos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "politicasPrestamo")
@Getter @Setter @NoArgsConstructor
public class PoliticaPrestamo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer politicaId;

    @Column(nullable = false, unique = true, length = 80)
    private String nombre;

    private int diasPrestamo = 7;
    private int maxEjemplares = 3;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tarifaRetrasoDiaria = BigDecimal.ONE;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxMultaRetraso;

    private boolean activa = true;
}
