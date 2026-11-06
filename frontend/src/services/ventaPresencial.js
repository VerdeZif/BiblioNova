import api from "./api";

export async function buscarEjemplaresVenta({
                                                q = "",
                                                page = 0,
                                                size = 10,
                                            } = {}) {
    const respuesta = await api.get("/inventario/ejemplares", {
        params: {
            q: String(q).trim(),
            estado: "Disponible",
            esVendible: true,
            esPrestamo: false,
            page,
            size,
        },
    });

    if (!Array.isArray(respuesta.data?.contenido)) {
        throw new Error("Formato de inventario inesperado.");
    }

    return respuesta.data;
}

export async function registrarVentaPresencial(datos) {
    const codigos = [...new Set(
        (datos.codigosEjemplar || [])
            .map((codigo) => String(codigo).trim())
            .filter(Boolean)
    )];

    if (codigos.length === 0) {
        throw new Error("Selecciona al menos un ejemplar.");
    }

    if (codigos.length > 30) {
        throw new Error("Puedes registrar hasta 30 ejemplares por venta.");
    }

    if (
        !["EFECTIVO_TIENDA", "TARJETA_TIENDA"].includes(
            datos.metodoPagoCodigo
        )
    ) {
        throw new Error("Selecciona un método de pago válido.");
    }

    const esEfectivo =
        datos.metodoPagoCodigo === "EFECTIVO_TIENDA";

    const montoTexto = String(datos.montoRecibido ?? "").trim();

    if (esEfectivo && !/^\d{1,8}(\.\d{1,2})?$/.test(montoTexto)) {
        throw new Error(
            "Ingresa un monto recibido válido, con hasta dos decimales."
        );
    }

    const payload = {
        lectorId: null,
        codigosEjemplar: codigos,
        metodoPagoCodigo: datos.metodoPagoCodigo,
        montoRecibido: esEfectivo
            ? Number(montoTexto)
            : null,
        referenciaPago:
            String(datos.referenciaPago ?? "").trim() || null,
        observaciones:
            String(datos.observaciones ?? "").trim() || null,
    };

    if (payload.referenciaPago?.length > 100) {
        throw new Error("La referencia supera los 100 caracteres.");
    }

    if (payload.observaciones?.length > 500) {
        throw new Error("Las observaciones superan los 500 caracteres.");
    }

    const respuesta = await api.post("/ventas", payload);

    return respuesta.data;
}