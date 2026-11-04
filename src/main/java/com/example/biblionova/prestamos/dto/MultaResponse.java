package com.example.biblionova.prestamos.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import com.example.biblionova.prestamos.entity.EstadoMulta;
import com.example.biblionova.prestamos.entity.TipoMulta;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

public record MultaResponse(Integer multaId, TipoMulta tipoMulta, EstadoMulta estado, BigDecimal monto,
                            BigDecimal pagado, BigDecimal saldo, int diasRetraso, BigDecimal tarifaAplicada,
                            String motivo, LocalDateTime fechaGeneracion, LocalDateTime fechaResolucion,
                            String evaluadaPor, ItemRef lector, Integer prestamoId, String codigoPrestamo,
                            Integer detallePrestamoId, String codigoEjemplar) {}
