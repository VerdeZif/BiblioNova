package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.TipoMovimiento;

public enum AccionManual {
    REGISTRAR_DANIO(TipoMovimiento.Danio, EstadoEjemplar.Danado),
    REGISTRAR_PERDIDA(TipoMovimiento.Perdida, EstadoEjemplar.Perdido),
    ENVIAR_A_REPARACION(TipoMovimiento.Reparacion, EstadoEjemplar.Reparacion),
    HABILITAR(TipoMovimiento.Ajuste, EstadoEjemplar.Disponible),
    DAR_DE_BAJA(TipoMovimiento.Baja, EstadoEjemplar.Baja);

    private final TipoMovimiento tipo;
    private final EstadoEjemplar destino;

    AccionManual(TipoMovimiento tipo, EstadoEjemplar destino) { this.tipo = tipo; this.destino = destino; }
    public TipoMovimiento tipo() { return tipo; }
    public EstadoEjemplar destino() { return destino; }
}
