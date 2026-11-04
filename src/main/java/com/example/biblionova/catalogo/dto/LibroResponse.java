package com.example.biblionova.catalogo.dto;

import com.example.biblionova.inventario.dto.StockLibro;
import java.math.BigDecimal;
import java.util.List;

public record LibroResponse(
        Integer libroId,
        String isbn,
        String titulo,
        ItemRef categoria,
        ItemRef editorial,
        Short anioPublicacion,
        String edicion,
        String descripcion,
        String imagenPortada,
        BigDecimal precioVenta,
        boolean prestamoHabilitado,
        boolean ventaHabilitada,
        boolean activo,
        List<ItemRef> autores,
        StockLibro stock) {}
