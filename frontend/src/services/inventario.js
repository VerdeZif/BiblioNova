import api from "./api";

const TAMANO_PAGINA = 50;

// Extraer registros de respuestas simples o paginadas.
function extraerElementos(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.resultados)) return data.resultados;
    return [];
}

// Consultar una colección respetando la paginación.
async function obtenerColeccion(ruta) {
    const primeraRespuesta = await api.get(ruta, {
        params: { page: 0, size: TAMANO_PAGINA },
    });

    const data = primeraRespuesta.data;
    const iniciales = extraerElementos(data);
    const totalPaginas = Number(data?.totalPaginas ?? data?.totalPages ?? 1);

    if (!Number.isInteger(totalPaginas) || totalPaginas <= 1) {
        return iniciales;
    }

    const solicitudes = [];
    for (let pagina = 1; pagina < totalPaginas; pagina += 1) {
        solicitudes.push(
            api.get(ruta, { params: { page: pagina, size: TAMANO_PAGINA } })
        );
    }

    const respuestas = await Promise.all(solicitudes);
    return [
        ...iniciales,
        ...respuestas.flatMap((respuesta) => extraerElementos(respuesta.data)),
    ];
}

function validarId(id, entidad) {
    const valor = Number(id);
    if (!Number.isInteger(valor) || valor <= 0) {
        throw new Error(`El identificador de ${entidad} no es válido.`);
    }
    return valor;
}

function normalizarProveedor(datos) {
    if (!datos || typeof datos !== "object") {
        throw new Error("Los datos del proveedor no son válidos.");
    }

    const payload = {
        razonSocial: String(datos.razonSocial ?? "").trim(),
        documentoFiscal: String(datos.documentoFiscal ?? "").trim(),
        contacto: String(datos.contacto ?? "").trim(),
        correo: String(datos.correo ?? "").trim(),
        telefono: String(datos.telefono ?? "").trim(),
        direccion: String(datos.direccion ?? "").trim(),
        activo: datos.activo,
    };

    if (payload.razonSocial.length < 2) {
        throw new Error("La razón social debe tener al menos 2 caracteres.");
    }
    if (payload.documentoFiscal.length < 5) {
        throw new Error("Ingresa un documento fiscal válido.");
    }
    if (payload.contacto.length < 2) {
        throw new Error("Ingresa el nombre de una persona de contacto.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
        throw new Error("Ingresa un correo electrónico válido.");
    }

    const digitosTelefono = payload.telefono.replace(/\D/g, "");
    if (digitosTelefono.length < 7 || digitosTelefono.length > 15) {
        throw new Error("El teléfono debe contener entre 7 y 15 dígitos.");
    }
    if (payload.direccion.length < 4) {
        throw new Error("Ingresa una dirección válida.");
    }
    if (typeof payload.activo !== "boolean") {
        throw new Error("El estado del proveedor no es válido.");
    }

    return payload;
}

function normalizarUbicacion(datos) {
    if (!datos || typeof datos !== "object") {
        throw new Error("Los datos de la ubicación no son válidos.");
    }

    const payload = {
        codigo: String(datos.codigo ?? "").trim(),
        descripcion: String(datos.descripcion ?? "").trim(),
        activa: datos.activa,
    };

    if (payload.codigo.length < 2) {
        throw new Error("El código debe tener al menos 2 caracteres.");
    }
    if (payload.descripcion.length < 2) {
        throw new Error("La descripción debe tener al menos 2 caracteres.");
    }
    if (typeof payload.activa !== "boolean") {
        throw new Error("El estado de la ubicación no es válido.");
    }

    return payload;
}

// Proveedores.
export async function listarProveedores() {
    return obtenerColeccion("/inventario/proveedores");
}

export async function crearProveedor(datos) {
    const respuesta = await api.post(
        "/inventario/proveedores",
        normalizarProveedor(datos)
    );
    return respuesta.data;
}

export async function actualizarProveedor(id, datos) {
    const proveedorId = validarId(id, "proveedor");
    const respuesta = await api.put(
        `/inventario/proveedores/${proveedorId}`,
        normalizarProveedor(datos)
    );
    return respuesta.data;
}

// Ubicaciones físicas.
export async function listarUbicaciones() {
    return obtenerColeccion("/inventario/ubicaciones");
}

export async function crearUbicacion(datos) {
    const respuesta = await api.post(
        "/inventario/ubicaciones",
        normalizarUbicacion(datos)
    );
    return respuesta.data;
}

export async function actualizarUbicacion(id, datos) {
    const ubicacionId = validarId(id, "ubicación");
    const respuesta = await api.put(
        `/inventario/ubicaciones/${ubicacionId}`,
        normalizarUbicacion(datos)
    );
    return respuesta.data;
}

// Historial de recepciones.
export async function listarRecepciones() {
    return obtenerColeccion("/inventario/recepciones");
}

// Registrar una recepción y sus ejemplares.
export async function registrarRecepcion(datos) {
    if (!datos || typeof datos !== "object") {
        throw new Error("Los datos de la recepción no son válidos.");
    }
    if (datos.tipoOrigen !== "Compra") {
        throw new Error("El tipo de origen de la recepción no es válido.");
    }

    const proveedorId = validarId(datos.proveedorId, "proveedor");
    if (!Array.isArray(datos.lineas) || datos.lineas.length === 0) {
        throw new Error("Agrega al menos un libro a la recepción.");
    }

    const lineas = datos.lineas.map((linea, index) => {
        const libroId = Number(linea.libroId);
        const cantidad = Number(linea.cantidad);
        const costoUnitario = Number(linea.costoUnitario);
        const ubicacionId = Number(linea.ubicacionId);

        if (!Number.isInteger(libroId) || libroId <= 0) {
            throw new Error(`Selecciona un libro válido en la línea ${index + 1}.`);
        }
        if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 10000) {
            throw new Error(`La cantidad de la línea ${index + 1} debe ser un entero entre 1 y 10000.`);
        }
        if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
            throw new Error(`El costo unitario de la línea ${index + 1} no es válido.`);
        }
        if (!Number.isInteger(ubicacionId) || ubicacionId <= 0) {
            throw new Error(`Selecciona una ubicación válida en la línea ${index + 1}.`);
        }
        if (
            typeof linea.esVendible !== "boolean" ||
            typeof linea.esPrestamo !== "boolean" ||
            (!linea.esVendible && !linea.esPrestamo)
        ) {
            throw new Error(`Selecciona venta, préstamo o ambas opciones en la línea ${index + 1}.`);
        }
        if (typeof linea.condicionFisica !== "string" || !linea.condicionFisica.trim()) {
            throw new Error(`La condición física de la línea ${index + 1} no es válida.`);
        }

        return {
            libroId,
            cantidad,
            costoUnitario,
            ubicacionId,
            esVendible: linea.esVendible,
            esPrestamo: linea.esPrestamo,
            condicionFisica: linea.condicionFisica.trim(),
            observaciones: String(linea.observaciones || "").trim(),
        };
    });

    const payload = {
        tipoOrigen: "Compra",
        proveedorId,
        donante: String(datos.donante || "").trim(),
        documentoReferencia: String(datos.documentoReferencia || "").trim(),
        observaciones: String(datos.observaciones || "").trim(),
        lineas,
    };

    const respuesta = await api.post("/inventario/recepciones", payload);
    return respuesta.data;
}

// Consultar el detalle de una recepción.
export async function obtenerRecepcionPorId(id) {
    const recepcionId = validarId(id, "recepción");
    const respuesta = await api.get(`/inventario/recepciones/${recepcionId}`);
    return respuesta.data;
}

// Consultar ejemplares con filtros y paginación.
export async function listarEjemplares({
                                           page = 0,
                                           size = 50,
                                           libroId,
                                           estado,
                                           ubicacionId,
                                           esVendible,
                                           esPrestamo,
                                           q,
                                       } = {}) {
    if (!Number.isInteger(Number(page)) || Number(page) < 0) {
        throw new Error("La página solicitada no es válida.");
    }
    if (!Number.isInteger(Number(size)) || Number(size) < 1 || Number(size) > 100) {
        throw new Error("El tamaño de página debe estar entre 1 y 100.");
    }

    const params = new URLSearchParams();
    if (libroId !== undefined && libroId !== "") {
        params.set("libroId", String(validarId(libroId, "libro")));
    }
    if (estado) params.set("estado", String(estado));
    if (ubicacionId !== undefined && ubicacionId !== "") {
        params.set("ubicacionId", String(validarId(ubicacionId, "ubicación")));
    }
    if (typeof esVendible === "boolean") params.set("esVendible", String(esVendible));
    if (typeof esPrestamo === "boolean") params.set("esPrestamo", String(esPrestamo));
    if (q?.trim()) params.set("q", q.trim());

    params.set("page", String(Number(page)));
    params.set("size", String(Number(size)));

    const respuesta = await api.get("/inventario/ejemplares", { params });
    return respuesta.data;
}

// Consultar el detalle de un ejemplar.
export async function obtenerEjemplarPorId(id) {
    const ejemplarId = validarId(id, "ejemplar");
    const respuesta = await api.get(`/inventario/ejemplares/${ejemplarId}`);
    return respuesta.data;
}

// Registrar daño en un ejemplar.
export async function cambiarEstadoEjemplar(id, datos) {
    const ejemplarId = validarId(id, "ejemplar");
    const motivo = String(datos?.motivo ?? "").trim();

    if (datos?.accion !== "REGISTRAR_DANIO") {
        throw new Error("La acción solicitada no está permitida.");
    }
    if (motivo.length < 5 || motivo.length > 300) {
        throw new Error("El motivo debe tener entre 5 y 300 caracteres.");
    }

    const respuesta = await api.post(
        `/inventario/ejemplares/${ejemplarId}/cambio-estado`,
        { accion: "REGISTRAR_DANIO", motivo }
    );
    return respuesta.data;
}
