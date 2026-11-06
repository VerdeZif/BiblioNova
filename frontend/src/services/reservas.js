
import api from "./api";

const TAMANO_PAGINA = 10;

function validarId(id, entidad) {
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
        throw new Error("La página no es válida.");
    }

    if (!Number.isInteger(tamano) || tamano < 1 || tamano > 100) {
        throw new Error("El tamaño de página no es válido.");
    }

    return { page: pagina, size: tamano };
}

// GET /api/reservas
export async function listarReservas({
                                         lectorId,
                                         libroId,
                                         estado,
                                         page = 0,
                                         size = TAMANO_PAGINA,
                                         sort,
                                     } = {}) {
    const params = validarPaginacion(page, size);

    if (lectorId !== undefined && lectorId !== "") {
        params.lectorId = validarId(lectorId, "lector");
    }

    if (libroId !== undefined && libroId !== "") {
        params.libroId = validarId(libroId, "libro");
    }

    if (estado) {
        params.estado = String(estado).trim();
    }

    if (Array.isArray(sort) && sort.length) {
        params.sort = sort;
    } else if (typeof sort === "string" && sort.trim()) {
        params.sort = sort.trim();
    }

    const respuesta = await api.get("/reservas", {
        params,
    });

    return respuesta.data;
}

// GET /api/reservas/mias
export async function listarMisReservas() {
    const respuesta = await api.get("/reservas/mias");

    if (!Array.isArray(respuesta.data)) {
        throw new Error(
            "La respuesta de mis reservas no tiene el formato esperado."
        );
    }

    return respuesta.data;
}

// POST /api/reservas
export async function crearReserva(datos) {
    const lectorId = validarId(datos?.lectorId, "lector");
    const libroId = validarId(datos?.libroId, "libro");

    const observaciones = String(
        datos?.observaciones ?? ""
    ).trim();

    if (observaciones.length > 1000) {
        throw new Error(
            "Las observaciones no pueden superar 1000 caracteres."
        );
    }

    const payload = {
        lectorId,
        libroId,
        observaciones,
    };

    const respuesta = await api.post(
        "/reservas",
        payload
    );

    return respuesta.data;
}

// POST /api/reservas/{id}/cancelar
export async function cancelarReserva(id) {
    const reservaId = validarId(id, "reserva");

    const respuesta = await api.post(
        `/reservas/${reservaId}/cancelar`
    );

    return respuesta.data;
}
