package com.example.biblionova.seguridad.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor
public class Rol {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer rolId;

    @Column(nullable = false, unique = true, length = 40)
    private String nombre;

    @Column(length = 250)
    private String descripcion;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "rolesPermisos",
            joinColumns = @JoinColumn(name = "rolId"),
            inverseJoinColumns = @JoinColumn(name = "permisoId"))
    private Set<Permiso> permisos = new HashSet<>();
}