import api from "./api";

// Métodos de pago permitidos según la modalidad de entrega.
const METODOS_PAGO = {
    Recojo: [
        "EFECTIVO_TIENDA",
        "TARJETA_TIENDA",
        "PAGO_ONLINE",
    ],
    Delivery: [
        "CONTRAENTREGA",
        "PAGO_ONLINE",
    ],
};

// Obtener las direcciones guardadas del cliente.
export async function obtenerMisDirecciones() {
    const respuesta = await api.get("/pedidos/direcciones");

    return respuesta.data;
}

// Registrar una nueva dirección.
// Se recibe el objeto con los campos definidos por el DTO del backend.
export async function registrarDireccion(datos) {
    const {
        destinatario,
        telefono,
        departamento,
        provincia,
        distrito,
        direccion,
        referencia,
        predeterminada,
    } = datos || {};

    const validarTexto = (valor, minimo, maximo) => {
        return (
            typeof valor === "string" &&
            valor.trim().length >= minimo &&
            valor.trim().length <= maximo
        );
    };

    const validarNombre = (valor) => {
        return (
            validarTexto(valor, 2, 120) &&
            /^[\p{L}\s.'-]+$/u.test(valor.trim())
        );
    };

    if (!validarNombre(destinatario)) {
        throw new Error(
            "El destinatario debe contener un nombre válido, sin números."
        );
    }

    if (!/^\d{9}$/.test(String(telefono || "").trim())) {
        throw new Error(
            "El teléfono debe contener exactamente 9 dígitos."
        );
    }

    if (!validarNombre(departamento)) {
        throw new Error("Ingresa un departamento válido.");
    }

    if (!validarNombre(provincia)) {
        throw new Error("Ingresa una provincia válida.");
    }

    if (!validarNombre(distrito)) {
        throw new Error("Ingresa un distrito válido.");
    }

    if (!validarTexto(direccion, 5, 200)) {
        throw new Error(
            "La dirección debe tener entre 5 y 200 caracteres."
        );
    }

    if (
        referencia &&
        !validarTexto(referencia, 1, 200)
    ) {
        throw new Error(
            "La referencia no puede superar los 200 caracteres."
        );
    }

    if (typeof predeterminada !== "boolean") {
        throw new Error(
            "Debes indicar si la dirección será predeterminada."
        );
    }

    const payload = {
        destinatario: destinatario.trim(),
        telefono: String(telefono).trim(),
        departamento: departamento.trim(),
        provincia: provincia.trim(),
        distrito: distrito.trim(),
        direccion: direccion.trim(),
        referencia: referencia?.trim() || "",
        predeterminada,
    };

    const respuesta = await api.post(
        "/pedidos/direcciones",
        payload
    );

    return respuesta.data;
}

// Crear un pedido real.
export async function crearPedido(datos) {
    const {
        tipoEntrega,
        direccionId,
        metodoPagoCodigo,
        lineas,
        observaciones,
    } = datos || {};

    // Validar modalidad.
    if (!["Recojo", "Delivery"].includes(tipoEntrega)) {
        throw new Error("Selecciona una modalidad de entrega válida.");
    }

    // Validar método de pago.
    const metodosPermitidos = METODOS_PAGO[tipoEntrega];

    if (!metodosPermitidos.includes(metodoPagoCodigo)) {
        throw new Error(
            "El método de pago no está permitido para esta modalidad de entrega."
        );
    }

    // Delivery requiere una dirección registrada.
    if (
        tipoEntrega === "Delivery" &&
        (!Number.isInteger(Number(direccionId)) ||
            Number(direccionId) <= 0)
    ) {
        throw new Error("Selecciona una dirección válida para el delivery.");
    }

    // Validar líneas del pedido.
    if (!Array.isArray(lineas) || lineas.length === 0) {
        throw new Error("El carrito no contiene productos.");
    }

    const identificadores = new Set();

    const lineasValidas = lineas.map((linea) => {
        const libroId = Number(linea.libroId);
        const cantidad = Number(linea.cantidad);

        if (
            !Number.isInteger(libroId) ||
            libroId <= 0
        ) {
            throw new Error("Uno de los libros tiene un identificador inválido.");
        }

        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {
            throw new Error("La cantidad de un producto no es válida.");
        }

        if (identificadores.has(libroId)) {
            throw new Error(
                "El carrito contiene libros duplicados. Revisa los productos."
            );
        }

        identificadores.add(libroId);

        return {
            libroId,
            cantidad,
        };
    });

    const payload = {
        tipoEntrega,
        metodoPagoCodigo,
        lineas: lineasValidas,
    };

    if (tipoEntrega === "Delivery") {
        payload.direccionId = Number(direccionId);
    }

    if (
        typeof observaciones === "string" &&
        observaciones.trim()
    ) {
        payload.observaciones = observaciones.trim();
    }

    // No enviar precios, subtotales ni identidad del comprador.
    const respuesta = await api.post("/pedidos", payload);

    return respuesta.data;
}

// Consultar los pedidos del cliente autenticado.
export async function obtenerMisPedidos() {
    const respuesta = await api.get("/pedidos/mios", {
        params: {
            page: 0,
            size: 50,
        },
    });

    return respuesta.data;
}

// Consultar el detalle de un pedido.
export async function obtenerPedidoPorId(id) {
    const pedidoId = Number(id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        throw new Error("El identificador del pedido no es válido.");
    }

    const respuesta = await api.get(`/pedidos/${pedidoId}`);

    return respuesta.data;
}

// Cancelar un pedido cuando el backend lo permita.
export async function cancelarPedido(id) {
    const pedidoId = Number(id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        throw new Error("El identificador del pedido no es válido.");
    }

    const respuesta = await api.post(
        `/pedidos/${pedidoId}/cancelar`
    );

    return respuesta.data;
}

// Ejecutar el pago simulado del backend.
export async function procesarPagoSimulado(
    pedidoId,
    pagoId,
    resultado
) {
    const idPedido = Number(pedidoId);
    const idPago = Number(pagoId);

    if (
        !Number.isInteger(idPedido) ||
        idPedido <= 0 ||
        !Number.isInteger(idPago) ||
        idPago <= 0
    ) {
        throw new Error("Los identificadores del pago no son válidos.");
    }

    if (!["APROBADO", "RECHAZADO"].includes(resultado)) {
        throw new Error("El resultado del pago no es válido.");
    }

    const respuesta = await api.post(
        `/pedidos/${idPedido}/pagos/${idPago}/pago-simulado`,
        { resultado }
    );

    return respuesta.data;
}