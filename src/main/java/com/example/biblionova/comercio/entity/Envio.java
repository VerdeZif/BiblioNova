package com.example.biblionova.comercio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "envios")
@Getter
@Setter
@NoArgsConstructor
public class Envio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long envioId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedidoId", nullable = false, unique = true)
    private Pedido pedido;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TipoEntrega modalidad;

    @Column(length = 100) private String operador;
    @Column(length = 100) private String codigoSeguimiento;
    private LocalDateTime fechaPreparacion;
    private LocalDateTime fechaDespacho;      // en Recojo: cuándo quedó listo; en Delivery: cuándo salió
    private LocalDateTime fechaEntrega;
    @Column(length = 150) private String recibidoPor;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 25)
    private EstadoEnvio estado = EstadoEnvio.Pendiente;

    @Column(length = 500) private String observaciones;
}