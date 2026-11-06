
import api from "./api";

const TAMANO_PAGINA = 10;

function validarId(id, entidad = "préstamo") {
    const valor = Number(id);

    if (!Number.isInteger(valor) || valor <= 0) {
        throw new Error(`El ID de ${entidad} no es válido.`);
    }

    return valor;
}

function validarPaginacion(page, size) {
    const pagina = Number(page);
    const tamano = Number(size);

    if (!Number.isInteger(pagina) || pagina < 0) {
        throw new Error("La página solicitada no es válida.");
    }

    if (!Number.isInteger(tamano) || tamano < 1 || tamano > 100) {
        throw new Error("El tamaño de página debe estar entre 1 y 100.");
    }

    return { page: pagina, size: tamano };
}

function validarObservaciones(
    valor,
    obligatorio = false,
    maximo = 500
) {
    const texto = String(valor ?? "").trim();

    if (obligatorio && !texto) {
        throw new Error("Debes ingresar un motivo.");
    }

    if (texto.length > maximo) {
        throw new Error(
            `El texto no puede superar ${maximo} caracteres.`
        );
    }

    return texto;
}

function validarCodigoEjemplar(valor) {
    const codigo = String(valor ?? "").trim();

    if (!codigo) {
        throw new Error("El código del ejemplar es obligatorio.");
    }

    if (codigo.length > 100) {
        throw new Error("El código del ejemplar es demasiado largo.");
    }

    return codigo;
}

// GET /api/prestamos
export async function listarPrestamos({
                                          lectorId,
                                          estado,
                                          soloVencidos,
                                          q = "",
                                          page = 0,
                                          size = TAMANO_PAGINA,
                                          sort,
                                      } = {}) {
    const params = validarPaginacion(page, size);

    if (lectorId !== undefined && lectorId !== "") {
        params.lectorId = validarId(lectorId, "lector");
    }

    if (estado) {
        params.estado = String(estado).trim();
    }

    if (typeof soloVencidos === "boolean") {
        params.soloVencidos = soloVencidos;
    }

    if (String(q).trim()) {
        params.q = String(q).trim();
    }

    if (Array.isArray(sort) && sort.length) {
        params.sort = sort;
    } else if (typeof sort === "string" && sort.trim()) {
        params.sort = sort.trim();
    }

    const respuesta = await api.get("/prestamos", { params });

    return respuesta.data;
}

// GET /api/prestamos/{id}
export async function obtenerPrestamoPorId(id) {
    const prestamoId = validarId(id);

    const respuesta = await api.get(
        `/prestamos/${prestamoId}`
    );

    return respuesta.data;
}

// POST /api/prestamos
export async function crearPrestamo(datos) {
    const lectorId = validarId(datos?.lectorId, "lector");

    if (
        !Array.isArray(datos?.codigosEjemplar) ||
        datos.codigosEjemplar.length === 0
    ) {
        throw new Error(
            "Debes seleccionar al menos un ejemplar."
        );
    }

    const codigosEjemplar = datos.codigosEjemplar.map(
        validarCodigoEjemplar
    );

    if (new Set(codigosEjemplar).size !== codigosEjemplar.length) {
        throw new Error(
            "No puedes registrar el mismo ejemplar dos veces."
        );
    }

    const payload = {
        lectorId,
        codigosEjemplar,
        observaciones: validarObservaciones(datos.observaciones),
    };

    const respuesta = await api.post("/prestamos", payload);

    return respuesta.data;
}

// POST /api/prestamos/{id}/devoluciones
export async function registrarDevolucion(id, datos) {
    const prestamoId = validarId(id);

    if (
        !Array.isArray(datos?.lineas) ||
        datos.lineas.length === 0
    ) {
        throw new Error(
            "Debes seleccionar al menos un ejemplar para devolver."
        );
    }

    const lineas = datos.lineas.map((linea) => {
        const condicionRecibida = String(
            linea?.condicionRecibida ?? ""
        ).trim();

        if (!condicionRecibida) {
            throw new Error(
                "Debes indicar la condición recibida del ejemplar."
            );
        }

        return {
            codigoEjemplar: validarCodigoEjemplar(
                linea.codigoEjemplar
            ),
            condicionRecibida,
            observaciones: validarObservaciones(
                linea.observaciones
            ),
        };
    });

    const codigos = lineas.map(
        (linea) => linea.codigoEjemplar
    );

    if (new Set(codigos).size !== codigos.length) {
        throw new Error(
            "No puedes devolver dos veces el mismo ejemplar."
        );
    }

    const payload = {
        lineas,
        observaciones: validarObservaciones(
            datos.observaciones
        ),
    };

    const respuesta = await api.post(
        `/prestamos/${prestamoId}/devoluciones`,
        payload
    );

    return respuesta.data;
}

// POST /api/prestamos/{id}/anular
export async function anularPrestamo(id, motivo) {
    const prestamoId = validarId(id);

    const payload = {
        motivo: validarObservaciones(motivo, true),
    };

    const respuesta = await api.post(
        `/prestamos/${prestamoId}/anular`,
        payload
    );

    return respuesta.data;
}
