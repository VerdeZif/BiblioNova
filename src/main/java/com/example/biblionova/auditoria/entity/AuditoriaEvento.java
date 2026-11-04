package com.example.biblionova.auditoria.entity;

import com.example.biblionova.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "auditoriaEventos")
@Getter
@Setter
@NoArgsConstructor
public class AuditoriaEvento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuarioId", updatable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 80, updatable = false) private String entidad;
    @Column(length = 80, updatable = false) private String entidadId;
    @Column(nullable = false, length = 80, updatable = false) private String accion;
    @Column(length = 500, updatable = false) private String descripcion;

    @JdbcTypeCode(SqlTypes.JSON) @Column(updatable = false)
    private Map<String, Object> datosAntes;

    @JdbcTypeCode(SqlTypes.JSON) @Column(updatable = false)
    private Map<String, Object> datosDespues;

    @Column(length = 45, updatable = false) private String direccionIp;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaEvento;

    @PrePersist
    void antesDeGuardar() { if (fechaEvento == null) fechaEvento = LocalDateTime.now(); }
}