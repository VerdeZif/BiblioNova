package com.example.biblionova.prestamos.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "lectores")
@Getter @Setter @NoArgsConstructor
public class Lector {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer lectorId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuarioId")
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 25)
    private String documento;

    @Column(nullable = false, length = 80)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(length = 150)
    private String correo;

    @Column(length = 25)
    private String telefono;

    @Column(length = 250)
    private String direccion;

    @Column(nullable = false, updatable = false)
    private LocalDate fechaRegistro;

    private boolean activo = true;

    @PrePersist
    void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDate.now();
    }

    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }
}
