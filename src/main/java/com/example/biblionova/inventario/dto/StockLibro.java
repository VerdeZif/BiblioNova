package com.example.biblionova.inventario.dto;

public record StockLibro(Integer libroId, long disponiblesVenta, long disponiblesPrestamo, long enInventario) {
    public static StockLibro vacio(Integer libroId) { return new StockLibro(libroId, 0, 0, 0); }
}
