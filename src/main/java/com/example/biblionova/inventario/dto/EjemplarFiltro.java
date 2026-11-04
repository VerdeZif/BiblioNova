package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.EstadoEjemplar;

public record EjemplarFiltro(Integer libroId, EstadoEjemplar estado, Integer ubicacionId,
                             Boolean esVendible, Boolean esPrestamo, String q) {}
