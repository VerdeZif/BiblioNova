package com.example.biblionova.inventario.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.inventario.entity.CondicionFisica;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import java.math.BigDecimal;
import java.time.LocalDate;

public record EjemplarResponse(Integer ejemplarId, String codigoEjemplar, ItemRef libro, ItemRef ubicacion,
                               EstadoEjemplar estado, boolean esVendible, boolean esPrestamo,
                               CondicionFisica condicionFisica, LocalDate fechaAdquisicion,
                               BigDecimal costoAdquisicion, String observaciones) {}

