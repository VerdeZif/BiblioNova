package com.example.biblionova.common.pago;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "metodosPago")
@Getter @Setter @NoArgsConstructor
public class MetodoPago {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer metodoId;

    @Column(nullable = false, unique = true, length = 35)
    private String codigo;

    @Column(nullable = false, length = 70)
    private String nombre;

    private boolean activo = true;
}
