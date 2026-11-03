import api from "./api";
import { books as demoBooks } from "../data/books";

// Modo demostración predeterminado. Para usar Spring Boot: VITE_USE_MOCKS=false.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function adaptLibro(libro) {
  return {
    id: libro.libroId,
    isbn: libro.isbn,
editorial: libro.editorial?.nombre || "No especificada",
anioPublicacion: libro.anioPublicacion,
descripcion: libro.descripcion || "Sin descripción disponible",
    title: libro.titulo,
    author: (libro.autores || []).map((a) => a.nombre).join(", ") || "Autor no registrado",
    category: libro.categoria?.nombre || "Sin categoría",
    price: Number(libro.precioVenta ?? 0),
    image: libro.imagenPortada || "/placeholder-book.svg",
    loanable: Boolean(libro.prestamoHabilitado && (libro.stock?.disponiblesPrestamo ?? 0) > 0),
    saleable: Boolean(libro.ventaHabilitada && (libro.stock?.disponiblesVenta ?? 0) > 0),
    stockVenta: Number(libro.stock?.disponiblesVenta ?? 0),
    stockPrestamo: Number(libro.stock?.disponiblesPrestamo ?? 0),
  };
}

export async function obtenerLibros() {
  if (USE_MOCKS) {
    return demoBooks.map((book) => ({
      ...book,
      saleable: true,
      stockVenta: book.stockVenta ?? 10,
      stockPrestamo: book.loanable ? 5 : 0,
    }));
  }
  const { data } = await api.get("/catalogo/libros", { params: { size: 100 } });
  const lista = data.contenido ?? data.content ?? data.items;
  if (!Array.isArray(lista)) {
    throw new Error("Formato de catálogo inesperado. Revisa PageResponse del backend.");
  }
  return lista.map(adaptLibro);
}
