package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.EstadoMulta;
import com.example.biblionova.prestamos.entity.TipoMulta;

public record MultaFiltro(Integer lectorId, EstadoMulta estado, TipoMulta tipo, Boolean soloConSaldo) {}
