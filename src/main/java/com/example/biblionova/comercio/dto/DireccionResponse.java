package com.example.biblionova.comercio.dto;

import com.example.biblionova.comercio.entity.DireccionEntrega;

public record DireccionResponse(Long direccionId, String destinatario, String telefono, String departamento,
                                String provincia, String distrito, String direccion, String referencia,
                                boolean predeterminada) {
    public static DireccionResponse de(DireccionEntrega d) {
        return new DireccionResponse(d.getDireccionId(), d.getDestinatario(), d.getTelefono(), d.getDepartamento(),
                d.getProvincia(), d.getDistrito(), d.getDireccion(), d.getReferencia(), d.isPredeterminada());
    }
}