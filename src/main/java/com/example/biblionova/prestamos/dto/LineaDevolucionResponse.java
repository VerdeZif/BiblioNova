package com.example.biblionova.prestamos.dto;

import com.example.biblionova.prestamos.entity.CondicionRecibida;

public record LineaDevolucionResponse(Integer detallePrestamoId, String codigoEjemplar,
                                      CondicionRecibida condicionRecibida, boolean requiereEvaluacion,
                                      int diasRetraso) {}
