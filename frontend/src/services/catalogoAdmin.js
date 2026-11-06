import api from "./api";

const TAMANO_PAGINA = 50;

// Extraer registros de una respuesta simple o paginada.
function extraerElementos(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;

    return [];
}

// Consultar una colección respetando el máximo de 50 registros.
async function obtenerColeccion(ruta) {
    const primeraRespuesta = await api.get(ruta, {
        params: {
            page: 0,
            size: TAMANO_PAGINA,
        },
    });

    const data = primeraRespuesta.data;
    const iniciales = extraerElementos(data);

    const totalPaginas = Number(
        data?.totalPaginas ??
        data?.totalPages ??
        1
    );

    if (
        !Number.isInteger(totalPaginas) ||
        totalPaginas <= 1
    ) {
        return iniciales;
    }

    const solicitudes = [];

    for (let pagina = 1; pagina < totalPaginas; pagina++) {
        solicitudes.push(
            api.get(ruta, {
                params: {
                    page: pagina,
                    size: TAMANO_PAGINA,
                },
            })
        );
    }

    const respuestas = await Promise.all(solicitudes);

    return [
        ...iniciales,
        ...respuestas.flatMap((respuesta) =>
            extraerElementos(respuesta.data)
        ),
    ];
}

// Libros para el panel de administración.
export async function listarLibrosGestion() {
    return obtenerColeccion("/catalogo/libros/gestion");
}

// Catálogo auxiliar para los formularios.
export async function listarCategoriasAdmin() {
    return obtenerColeccion("/catalogo/categorias");
}

export async function listarEditorialesAdmin() {
    return obtenerColeccion("/catalogo/editoriales");
}

export async function listarAutoresAdmin() {
    return obtenerColeccion("/catalogo/autores");
}

// Registrar un libro.
export async function crearLibro(datos) {
    const respuesta = await api.post(
        "/catalogo/libros",
        datos
    );

    return respuesta.data;
}

// Actualizar un libro existente.
export async function actualizarLibro(id, datos) {
    const libroId = Number(id);

    if (!Number.isInteger(libroId) || libroId <= 0) {
        throw new Error("El identificador del libro no es válido.");
    }

    const respuesta = await api.put(
        `/catalogo/libros/${libroId}`,
        datos
    );

    return respuesta.data;
}

// Activar o desactivar un libro sin eliminarlo físicamente.
export async function cambiarEstadoLibro(id, activo) {
    const libroId = Number(id);

    if (
        !Number.isInteger(libroId) ||
        libroId <= 0 ||
        typeof activo !== "boolean"
    ) {
        throw new Error("Los datos para cambiar el estado no son válidos.");
    }

    const respuesta = await api.patch(
        `/catalogo/libros/${libroId}/activo`,
        null,
        {
            params: {
                valor: activo,
            },
        }
    );

    return respuesta.data;
}