
import api from "./api";

export async function listarVentasVendedor({
                                               page = 0,
                                               size = 10,
                                           } = {}) {
    const respuesta = await api.get("/ventas", {
        params: {
            page,
            size,
        },
    });

    return respuesta.data;
}

export async function obtenerVentaVendedor(id) {
    const ventaId = Number(id);

    if (!Number.isInteger(ventaId) || ventaId <= 0) {
        throw new Error("El ID de venta no es válido.");
    }

    const respuesta = await api.get(`/ventas/${ventaId}`);

    return respuesta.data;
}

export async function listarPedidosVendedor({
                                                page = 0,
                                                size = 10,
                                            } = {}) {
    const respuesta = await api.get("/pedidos", {
        params: {
            page,
            size,
        },
    });

    return respuesta.data;
}

export async function obtenerPedidoVendedor(id) {
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
        throw new Error("El ID del pedido no es válido.");
    }

    const respuesta = await api.get(`/pedidos/${pedidoId}`);
    return respuesta.data;
}


export async function cambiarEstadoPedidoVendedor(
    pedidoId,
    {
        estado,
        operador = "",
        codigoSeguimiento = "",
        recibidoPor = "",
        observaciones = "",
    }
) {
    const id = Number(pedidoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("El ID del pedido no es válido.");
    }

    const estadosValidos = [
        "Pendiente",
        "Confirmado",
        "Preparando",
        "ListoRecojo",
        "Despachado",
        "Entregado",
        "Cancelado",
    ];

    if (!estadosValidos.includes(estado)) {
        throw new Error("Selecciona un estado válido.");
    }

    // La cancelación tiene su propio endpoint y sus
    // propias reglas de negocio.
    if (estado === "Cancelado") {
        throw new Error(
            "Para cancelar un pedido utiliza la operación de cancelación."
        );
    }

    const payload = {
        estado,
        operador: String(operador).trim() || null,
        codigoSeguimiento:
            String(codigoSeguimiento).trim() || null,
        recibidoPor: String(recibidoPor).trim() || null,
        observaciones: String(observaciones).trim() || null,
    };

    const limites = {
        operador: 100,
        codigoSeguimiento: 100,
        recibidoPor: 150,
        observaciones: 500,
    };

    for (const [campo, limite] of Object.entries(limites)) {
        if ((payload[campo]?.length ?? 0) > limite) {
            throw new Error(
                `El campo ${campo} supera los ${limite} caracteres.`
            );
        }
    }

    const respuesta = await api.post(
        `/pedidos/${id}/estado`,
        payload
    );

    return respuesta.data;
}

export async function confirmarPedidoVendedor(id) {
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
        throw new Error("El ID del pedido no es válido.");
    }

    const respuesta = await api.post(
        `/pedidos/${pedidoId}/confirmar`
    );

    return respuesta.data;
}


export async function confirmarPagoPedidoVendedor(
    pedidoId,
    pagoId,
    referenciaExterna = ""
) {
    const idPedido = Number(pedidoId);
    const idPago = Number(pagoId);

    if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
        throw new Error("El ID del pedido no es válido.");
    }

    if (!Number.isSafeInteger(idPago) || idPago <= 0) {
        throw new Error("El ID del pago no es válido.");
    }

    const referencia = String(referenciaExterna).trim();

    const respuesta = await api.post(
        `/pedidos/${idPedido}/pagos/${idPago}/confirmar`,
        referencia
            ? { referenciaExterna: referencia }
            : {}
    );

    return respuesta.data;
}



export async function cancelarPedidoVendedor(pedidoId, motivo) {
    const id = Number(pedidoId);
    const texto = String(motivo ?? "").trim();

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("El ID del pedido no es válido.");
    }

    if (!texto) {
        throw new Error("Debes indicar el motivo de cancelación.");
    }

    const respuesta = await api.post(
        `/pedidos/${id}/cancelar`,
        { motivo: texto }
    );

    return respuesta.data;
}
