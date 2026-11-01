package com.example.biblionova.catalogo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "editoriales")
@Getter @Setter @NoArgsConstructor // <-- Confirma que estén estos 3
public class Editorial {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer editorialId;

    @Column(nullable = false, unique = true, length = 150)
    private String nombre;

    @Column(length = 80)
    private String pais;

    @Column(length = 250)
    private String sitioWeb;
}
