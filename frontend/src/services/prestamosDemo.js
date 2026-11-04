
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
  if (!book.loanable) {
    throw new Error("Este libro no está disponible para préstamo.");
  }

  const prestamos = obtenerPrestamosDemo();

  const existe = prestamos.some(
    (prestamo) =>
      prestamo.libroId === book.id &&
      prestamo.estado === "Pendiente"
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

  const actualizados = prestamos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString(),
        }
      : item
  );

  localStorage.setItem(
    "biblionova_prestamos_demo",
    JSON.stringify(actualizados)
  );

  return actualizados;
}
