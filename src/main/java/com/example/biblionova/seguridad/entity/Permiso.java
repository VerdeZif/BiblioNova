package com.example.biblionova.seguridad.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permisos")
@Getter @Setter @NoArgsConstructor
public class Permiso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer permisoId;

    @Column(nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(length = 250)
    private String descripcion;
}