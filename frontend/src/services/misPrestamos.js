
import api from "./api";

export async function listarMisPrestamos({
                                             page = 0,
                                             size = 10,
                                         } = {}) {
    const pagina = Number(page);
    const tamano = Number(size);

    if (!Number.isInteger(pagina) || pagina < 0) {
        throw new Error("La página solicitada no es válida.");
    }

    if (!Number.isInteger(tamano) || tamano < 1 || tamano > 50) {
        throw new Error("El tamaño de página no es válido.");
    }

    const respuesta = await api.get("/prestamos/mios", {
        params: {
            page: pagina,
            size: tamano,
        },
    });

    if (!Array.isArray(respuesta.data?.contenido)) {
        throw new Error(
            "El servidor no devolvió una lista válida de préstamos."
        );
    }

    return respuesta.data;
}

export async function obtenerMiPrestamo(id) {
    const prestamoId = Number(id);

    if (!Number.isInteger(prestamoId) || prestamoId <= 0) {
        throw new Error("El identificador del préstamo no es válido.");
    }

    const respuesta = await api.get(
        `/prestamos/mios/${prestamoId}`
    );

    return respuesta.data;
}
