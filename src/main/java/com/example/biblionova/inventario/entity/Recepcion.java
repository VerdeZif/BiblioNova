package com.example.biblionova.inventario.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity @Table(name = "recepciones")
@Getter @Setter @NoArgsConstructor
public class Recepcion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recepcionId;

    @Column(nullable = false, unique = true, length = 40)
    private String codigoRecepcion;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TipoOrigen tipoOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedorId")
    private Proveedor proveedor;

    @Column(length = 180) private String donante;
    @Column(length = 100) private String documentoReferencia;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaRecepcion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuarioId", nullable = false)
    private Usuario usuario;

    @Column(length = 500) private String observaciones;

    @PrePersist
    void antesDeGuardar() { if (fechaRecepcion == null) fechaRecepcion = LocalDateTime.now(); }
}
