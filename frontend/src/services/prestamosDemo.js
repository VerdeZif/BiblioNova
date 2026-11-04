import { obtenerLibrosAdminDemo } from "./librosAdminDemo";

const INVENTARIO_KEY = "biblionova_libros_admin_demo";

const STORAGE_KEY = "biblionova_prestamos_demo";

export function obtenerPrestamosDemo() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function solicitarPrestamoDemo(book) {
  const libroActual = obtenerLibrosAdminDemo().find((libro) => String(libro.id) === String(book.id));
  if (!libroActual?.loanable || Number(libroActual.stockPrestamo) <= 0) {
    throw new Error("Este libro no está disponible para préstamo.");
  }

  const prestamos = obtenerPrestamosDemo();

  const existe = prestamos.some(
    (prestamo) =>
      String(prestamo.libroId) === String(book.id) &&
      ["Pendiente", "Aprobado"].includes(prestamo.estado)
  );

  if (existe) {
    throw new Error("Ya tienes una solicitud pendiente para este libro.");
  }

  const solicitud = {
    id: crypto.randomUUID(),
    libroId: book.id,
    titulo: book.title,
    autor: book.author,
    imagen: book.image,
    fechaSolicitud: new Date().toISOString(),
    estado: "Pendiente",
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([solicitud, ...prestamos])
  );

  return solicitud;
}

export function cambiarEstadoPrestamoDemo(id, nuevoEstado) {
  const estadosPermitidos = [
    "Pendiente",
    "Aprobado",
    "Rechazado",
    "Devuelto",
  ];

  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error("Estado de préstamo no válido.");
  }

  const prestamos = obtenerPrestamosDemo();

  const prestamo = prestamos.find(
    (item) => item.id === id
  );

  if (!prestamo) {
    throw new Error("Préstamo no encontrado.");
  }

  const transiciones = {
    Pendiente: ["Aprobado", "Rechazado"],
    Aprobado: ["Devuelto"],
    Rechazado: [],
    Devuelto: [],
  };

  if (!transiciones[prestamo.estado]?.includes(nuevoEstado)) {
    throw new Error("Cambio de estado no permitido.");
  }

  const libros = obtenerLibrosAdminDemo();
  const libro = libros.find((item) => String(item.id) === String(prestamo.libroId));
  const descontar = nuevoEstado === "Aprobado";
  const reponer = nuevoEstado === "Devuelto" && prestamo.stockDescontado === true;

  if (descontar && (!libro?.loanable || Number(libro.stockPrestamo) <= 0)) {
    throw new Error("No quedan ejemplares disponibles para préstamo.");
  }

  const actualizados = prestamos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString(),
          stockDescontado: descontar ? true : reponer ? false : item.stockDescontado,
        }
      : item
  );

  if ((descontar || reponer) && libro) {
    const inventarioActualizado = libros.map((item) =>
      String(item.id) === String(libro.id)
        ? { ...item, stockPrestamo: Number(item.stockPrestamo) + (descontar ? -1 : 1) }
        : item
    );
    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventarioActualizado));
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
  } catch (error) {
    if (descontar || reponer) {
      localStorage.setItem(INVENTARIO_KEY, JSON.stringify(libros));
    }
    throw error;
  }

  return actualizados;
}
