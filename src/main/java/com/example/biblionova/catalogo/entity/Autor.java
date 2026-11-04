package com.example.biblionova.catalogo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;

@Entity
@Table(name = "autores")
@Getter @Setter @NoArgsConstructor // <-- Confirma que estén estos 3
public class Autor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer autorId;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(length = 100)
    private String apellidos;

    @Column(length = 80)
    private String nacionalidad;

    private LocalDate fechaNacimiento;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(columnDefinition = "TEXT")
    private String biografia;

    public String getNombreCompleto() {
        return apellidos == null || apellidos.isBlank() ? nombres : nombres + " " + apellidos;
    }
}
