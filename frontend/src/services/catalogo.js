
import { listarLibros } from "./catalogoApi";

// BiblioNova utiliza Spring Boot y MySQL.
// Se conserva por compatibilidad con componentes que
// todavía importen USE_MOCKS.
export const USE_MOCKS = false;

// Adaptar la respuesta Java al formato utilizado por React.
export function adaptLibro(libro) {
    return {
        id: libro.libroId,
        isbn: libro.isbn,
        editorial: libro.editorial?.nombre || "No especificada",
        anioPublicacion: libro.anioPublicacion,
        descripcion:
            libro.descripcion || "Sin descripción disponible",

        title: libro.titulo,

        author:
            (libro.autores || [])
                .map((autor) => autor.nombre)
                .join(", ") || "Autor no registrado",

        category: libro.categoria?.nombre || "Sin categoría",

        price: Number(libro.precioVenta ?? 0),

        image: libro.imagenPortada || "/placeholder-book.svg",

        loanable: Boolean(
            libro.prestamoHabilitado &&
            (libro.stock?.disponiblesPrestamo ?? 0) > 0
        ),

        saleable: Boolean(
            libro.ventaHabilitada &&
            (libro.stock?.disponiblesVenta ?? 0) > 0
        ),

        stockVenta: Number(
            libro.stock?.disponiblesVenta ?? 0
        ),

        stockPrestamo: Number(
            libro.stock?.disponiblesPrestamo ?? 0
        ),
    };
}

// Obtener libros reales desde Spring Boot.
export async function obtenerLibros() {
    return await listarLibros();
}
