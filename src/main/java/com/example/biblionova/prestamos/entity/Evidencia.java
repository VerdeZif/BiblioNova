package com.example.biblionova.prestamos.entity;

import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "evidenciasEjemplares")
@Getter @Setter @NoArgsConstructor
public class Evidencia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long evidenciaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ejemplarId", nullable = false)
    private Ejemplar ejemplar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detallePrestamoId")
    private DetallePrestamo detallePrestamo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detalleDevolucionId")
    private DetalleDevolucion detalleDevolucion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuarioId", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 25)
    private TipoEvidencia tipoEvidencia;

    @Column(nullable = false, length = 500)
    private String rutaArchivo;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }
}

