package com.example.biblionova.catalogo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "libros")
@Getter @Setter @NoArgsConstructor
public class Libro {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer libroId;

    @Column(unique = true, length = 20)
    private String isbn;

    @Column(nullable = false, length = 250)
    private String titulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoriaId")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "editorialId")
    private Editorial editorial;

    private Short anioPublicacion;

    @Column(length = 50)
    private String edicion;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 500)
    private String imagenPortada;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    private boolean prestamoHabilitado = true;
    private boolean ventaHabilitada = true;
    private boolean activo = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "autoresLibros",
            joinColumns = @JoinColumn(name = "libroId"),
            inverseJoinColumns = @JoinColumn(name = "autorId"))
    @BatchSize(size = 50)
    private Set<Autor> autores = new LinkedHashSet<>();

    @PrePersist
    void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }
}
