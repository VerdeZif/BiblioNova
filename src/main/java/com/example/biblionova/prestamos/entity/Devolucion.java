
package com.example.biblionova.prestamos.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "devoluciones")
@Getter
@Setter
@NoArgsConstructor
public class Devolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long devolucionId;

    @Column(
            nullable = false,
            unique = true,
            length = 40
    )
    private String codigoDevolucion;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "prestamoId",
            nullable = false
    )
    private Prestamo prestamo;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "usuarioId",
            nullable = false
    )
    private Usuario usuario;

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime fechaDevolucion;

    @Column(length = 500)
    private String observaciones;

    @PrePersist
    void antesDeGuardar() {
        if (fechaDevolucion == null) {
            fechaDevolucion = LocalDateTime.now();
        }
    }
}
