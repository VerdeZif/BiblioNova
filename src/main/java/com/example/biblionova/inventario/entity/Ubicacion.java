package com.example.biblionova.inventario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "ubicaciones")
@Getter @Setter @NoArgsConstructor
public class Ubicacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ubicacionId;
    @Column(nullable = false, unique = true, length = 40)
    private String codigo;
    @Column(length = 200)
    private String descripcion;
    private boolean activa = true;
}