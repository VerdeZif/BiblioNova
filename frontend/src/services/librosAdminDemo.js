
import { books } from "../data/books";

const STORAGE_KEY = "biblionova_libros_admin_demo";

function normalizarLibro(book) {
  return {
    ...book,
    stockVenta:
      book.stockVenta == null
        ? 10
        : Number(book.stockVenta),

    stockPrestamo:
      book.stockPrestamo == null
        ? (book.loanable ? 5 : 0)
        : Number(book.stockPrestamo),

    saleable: book.saleable !== false,
    loanable: book.loanable === true,
  };
}

function librosIniciales() {
  return books.map(normalizarLibro);
}

export function obtenerLibrosAdminDemo() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (guardados !== null) {
      const libros = JSON.parse(guardados);

      if (Array.isArray(libros)) {
        const normalizados = libros.map(normalizarLibro);

        // Actualizar registros antiguos sin perder cambios.
            if (JSON.stringify(libros) !== JSON.stringify(normalizados)) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizados)
  );
}

return normalizados;
      }
    }
  } catch (error) {
    console.error("Error al cargar libros:", error);
  }

  const iniciales = librosIniciales();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(iniciales)
  );

  return iniciales;
}

export function guardarLibroAdminDemo(datos) {
  const libros = obtenerLibrosAdminDemo();

  if (!datos.title?.trim()) {
    throw new Error("El título es obligatorio.");
  }

  if (!datos.author?.trim()) {
    throw new Error("El autor es obligatorio.");
  }

  const precio = Number(datos.price);
  const stockVenta = Number(datos.stockVenta);
  const stockPrestamo = Number(datos.stockPrestamo);

  if (
    !Number.isFinite(precio) ||
    precio < 0 ||
    !Number.isInteger(stockVenta) ||
    stockVenta < 0 ||
    !Number.isInteger(stockPrestamo) ||
    stockPrestamo < 0
  ) {
    throw new Error("Revisa el precio y las cantidades disponibles.");
  }

  const id = datos.id
    ? Number(datos.id)
    : Math.max(0, ...libros.map((libro) => Number(libro.id) || 0)) + 1;

  const libro = {
    id,
    title: datos.title.trim(),
    author: datos.author.trim(),
    category: datos.category?.trim() || "General",
    price: precio,
    image: datos.image?.trim() || "/placeholder-book.svg",
    description: datos.description?.trim() || "",
    isbn: datos.isbn?.trim() || "",
    editorial: datos.editorial?.trim() || "",
    anioPublicacion: datos.anioPublicacion || "",
    stockVenta,
    stockPrestamo,
    saleable: Boolean(datos.saleable),
    loanable: Boolean(datos.loanable),
  };

  const existe = libros.some((item) => Number(item.id) === id);

  const actualizados = existe
    ? libros.map((item) => Number(item.id) === id ? libro : item)
    : [...libros, libro];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
  return libro;
}

export function eliminarLibroAdminDemo(id) {
  const libros = obtenerLibrosAdminDemo();
  const actualizados = libros.filter(
    (libro) => Number(libro.id) !== Number(id)
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
  return actualizados;
}
