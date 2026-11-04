package com.example.biblionova.inventario.dto;

import com.example.biblionova.catalogo.dto.ItemRef;
import java.math.BigDecimal;
import java.util.List;

public record LineaRecepcionResponse(Long detalleRecepcionId, ItemRef libro, int cantidad,
                                     BigDecimal costoUnitario, List<String> ejemplares) {}
