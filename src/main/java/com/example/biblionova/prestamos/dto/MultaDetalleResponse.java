package com.example.biblionova.prestamos.dto;

import java.util.List;

public record MultaDetalleResponse(MultaResponse multa, List<PagoMultaResponse> pagos, long evidencias) {}
