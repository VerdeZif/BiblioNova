package com.example.biblionova.catalogo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categorias")
@Getter @Setter @NoArgsConstructor // <-- Confirma que estén estos 3
public class Categoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer categoriaId;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(length = 300)
    private String descripcion;

    private boolean activa = true;
}
