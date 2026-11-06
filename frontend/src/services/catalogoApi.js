import api from "./api";

const TAMANO_PAGINA = 50;

// Obtener los elementos de una respuesta, sea paginada o una lista simple.
function extraerElementos(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;

    return [];
}

// Consultar todas las páginas sin superar el límite de 50 registros.
async function obtenerColeccion(ruta) {
    const primeraRespuesta = await api.get(ruta, {
        params: {
            page: 0,
            size: TAMANO_PAGINA,
        },
    });

    const primeraPagina = primeraRespuesta.data;
    const elementosIniciales = extraerElementos(primeraPagina);

    const totalPaginas = Number(
        primeraPagina?.totalPaginas ??
        primeraPagina?.totalPages ??
        1
    );

    if (!Number.isFinite(totalPaginas) || totalPaginas <= 1) {
        return elementosIniciales;
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

    const paginasAdicionales = respuestas.flatMap((respuesta) =>
        extraerElementos(respuesta.data)
    );

    return [...elementosIniciales, ...paginasAdicionales];
}

// Adaptar el libro del backend al formato que ya utiliza React.
export function adaptarLibro(libro) {
    const autores = Array.isArray(libro.autores)
        ? libro.autores
        : [];

    const stock = libro.stock ?? {};

    return {
        ...libro,

        id: libro.libroId ?? libro.id,
        isbn: libro.isbn ?? "",
        title: libro.titulo ?? libro.title ?? "",

        author: autores
            .map((autor) => autor.nombre)
            .filter(Boolean)
            .join(", "),

        category: libro.categoria?.nombre ?? "",
        editorial: libro.editorial?.nombre ?? "",

        year: libro.anioPublicacion ?? null,
        anioPublicacion: libro.anioPublicacion ?? null,
        descripcion: libro.descripcion ?? "",

        price: Number(libro.precioVenta ?? 0),

        image: libro.imagenPortada || "/placeholder-book.svg",

        // Capacidad habilitada, independiente del stock disponible.
        loanable: Boolean(libro.prestamoHabilitado),
        saleable: Boolean(libro.ventaHabilitada),

        // Cantidades actuales de ejemplares disponibles.
        stockVenta: Number(stock.disponiblesVenta ?? 0),
        stockPrestamo: Number(stock.disponiblesPrestamo ?? 0),
    };
}

// Obtener el catálogo completo.
export async function listarLibros() {
    const libros = await obtenerColeccion("/catalogo/libros");

    return libros.map(adaptarLibro);
}

// Obtener un libro específico.
export async function obtenerLibroPorId(id) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        throw new Error("El identificador del libro no es válido.");
    }

    const respuesta = await api.get(
        `/catalogo/libros/${id}`
    );

    return adaptarLibro(respuesta.data);
}

// Obtener editoriales.
export async function listarEditoriales() {
    return obtenerColeccion("/catalogo/editoriales");
}

// Obtener autores.
export async function listarAutores() {
    return obtenerColeccion("/catalogo/autores");
}

// Adaptar las categorías del backend al formato de React.
export function adaptarCategoria(categoria) {
    return {
        ...categoria,
        id: categoria.categoriaId ?? categoria.id,
        name: categoria.nombre ?? categoria.name ?? "",
    };
}

// Consultar las categorías reales.
export async function listarCategorias() {
    const categorias = await obtenerColeccion(
        "/catalogo/categorias"
    );

    return categorias.map(adaptarCategoria);
}