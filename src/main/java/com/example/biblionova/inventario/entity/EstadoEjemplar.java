package com.example.biblionova.inventario.entity;

import java.util.EnumSet;
import java.util.Set;

public enum EstadoEjemplar {
    Disponible, Prestado, Reservado, ApartadoPedido, Vendido, Danado, Perdido, Reparacion, Baja;

    /** Matriz de transiciones válidas. Vendido y Baja son estados finales. */
    public Set<EstadoEjemplar> destinosPermitidos() {
        return switch (this) {
            case Disponible -> EnumSet.of(Prestado, Reservado, ApartadoPedido, Vendido, Danado, Perdido, Reparacion, Baja);
            case Prestado -> EnumSet.of(Disponible, Danado, Perdido);
            case Reservado -> EnumSet.of(Disponible, Prestado);
            case ApartadoPedido -> EnumSet.of(Disponible, Vendido);
            case Danado -> EnumSet.of(Disponible, Reparacion, Baja);
            case Perdido -> EnumSet.of(Disponible, Baja);
            case Reparacion -> EnumSet.of(Disponible, Danado, Baja);
            case Vendido, Baja -> EnumSet.noneOf(EstadoEjemplar.class);
        };
    }
}
