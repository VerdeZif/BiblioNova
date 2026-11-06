
import api from "./api";

export async function buscarEjemplaresPrestables({
                                                     q = "",
                                                     page = 0,
                                                     size = 10,
                                                 } = {}) {
    const pagina = Number(page);
    const tamano = Number(size);

    if (!Number.isInteger(pagina) || pagina < 0) {
        throw new Error("Página de ejemplares inválida.");
    }

    if (!Number.isInteger(tamano) || tamano < 1 || tamano > 100) {
        throw new Error("Tamaño de página inválido.");
    }

    const params = {
        page: pagina,
        size: tamano,
        estado: "Disponible",
        esPrestamo: true,
    };

    if (String(q).trim()) {
        params.q = String(q).trim();
    }

    const respuesta = await api.get(
        "/inventario/ejemplares",
        { params }
    );

    if (!Array.isArray(respuesta.data?.contenido)) {
        throw new Error(
            "El servidor no devolvió una lista válida de ejemplares."
        );
    }

    return respuesta.data;
}
