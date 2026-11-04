package com.example.biblionova.seguridad.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter @Setter @NoArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer usuarioId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rolId", nullable = false)
    private Rol rol;

    @Column(nullable = false, length = 120)
    private String nombreCompleto;

    @Column(nullable = false, unique = true, length = 50)
    private String nombreUsuario;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(nullable = false)
    private String hashContrasena;

    private boolean activo = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    private LocalDateTime ultimoAcceso;

    @PrePersist
    void antesDeGuardar() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
    }
}