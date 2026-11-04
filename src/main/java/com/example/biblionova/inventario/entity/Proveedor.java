package com.example.biblionova.inventario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name = "proveedores")
@Getter @Setter @NoArgsConstructor
public class Proveedor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer proveedorId;
    @Column(nullable = false, length = 180)
    private String razonSocial;
    @Column(unique = true, length = 25)
    private String documentoFiscal;
    @Column(length = 120) private String contacto;
    @Column(length = 150) private String correo;
    @Column(length = 25) private String telefono;
    @Column(length = 250) private String direccion;
    private boolean activo = true;
}
