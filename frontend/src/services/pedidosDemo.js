
import { obtenerLibrosAdminDemo } from "./librosAdminDemo";

const STORAGE_KEY = "biblionova_pedidos_demo";
const INVENTARIO_KEY = "biblionova_libros_admin_demo";

// ==========================================
// ESTADOS DE PEDIDOS
// ==========================================

export const ESTADOS_PEDIDO_DEMO = [
  "Pendiente de confirmación",
  "Confirmado",
  "En preparación",
  "Listo para recoger",
  "En camino",
  "Entregado",
  "Cancelado",
];

// ==========================================
// OBTENER PEDIDOS
// ==========================================

export function obtenerPedidosDemo() {
  try {
    const pedidos = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(pedidos) ? pedidos : [];
  } catch {
    return [];
  }
}

// ==========================================
// VALIDAR INVENTARIO
// ==========================================

function validarStockVenta(items, libros) {
  const cantidades = new Map();

  for (const item of items) {
    const id = Number(item.id);
    const cantidad = Number(item.quantity);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error(
        `Cantidad inválida para "${item.title}".`
      );
    }

    cantidades.set(
      id,
      (cantidades.get(id) || 0) + cantidad
    );
  }

  for (const [id, cantidad] of cantidades) {
    const libro = libros.find(
      (libro) => Number(libro.id) === id
    );

    if (!libro) {
      throw new Error(
        `El libro con ID ${id} no existe.`
      );
    }

    if (!libro.saleable) {
      throw new Error(
        `"${libro.title}" no está disponible para venta.`
      );
    }

    if (Number(libro.stockVenta) < cantidad) {
      throw new Error(
        `Stock insuficiente para "${libro.title}". Disponibles: ${libro.stockVenta}.`
      );
    }
  }

  return cantidades;
}

// ==========================================
// CREAR PEDIDO Y DESCONTAR INVENTARIO
// ==========================================

export function crearPedidoDemo(datos, items, total) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const libros = obtenerLibrosAdminDemo();

  // Validar existencias actuales
  const cantidades = validarStockVenta(items, libros);

  const pedidosAnteriores = obtenerPedidosDemo();

  const pedido = {
    id: crypto.randomUUID(),
    numero: `BN-${Date.now()}`,
    fecha: new Date().toISOString(),
    estado: "Pendiente de confirmación",
    demostracion: true,
    stockDescontado: true,
    cliente: { ...datos },
    productos: items.map((item) => ({
      id: item.id,
      titulo: item.title,
      precio: item.price,
      cantidad: item.quantity,
      subtotal: item.price * item.quantity,
    })),
    total,
  };

  // Calcular nuevas existencias
  const inventarioActualizado = libros.map((libro) => {
    const cantidad = cantidades.get(Number(libro.id)) || 0;

    if (cantidad === 0) return libro;

    return {
      ...libro,
      stockVenta: Number(libro.stockVenta) - cantidad,
    };
  });

  // Guardar inventario y pedido
  localStorage.setItem(
    INVENTARIO_KEY,
    JSON.stringify(inventarioActualizado)
  );

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([pedido, ...pedidosAnteriores])
    );
  } catch (error) {
    // Restaurar inventario si falla el guardado del pedido
    localStorage.setItem(
      INVENTARIO_KEY,
      JSON.stringify(libros)
    );

    throw error;
  }

  return pedido;
}

// ==========================================
// ACTUALIZAR ESTADO DEL PEDIDO
// ==========================================
// ==========================================
// REPONER STOCK DE PEDIDOS CANCELADOS
// ==========================================

function reponerStockVenta(pedido) {
  const libros = obtenerLibrosAdminDemo();

  const actualizados = libros.map((libro) => {
    const cantidad = pedido.productos
      .filter(
        (producto) =>
          Number(producto.id) === Number(libro.id)
      )
      .reduce(
        (total, producto) =>
          total + Number(producto.cantidad),
        0
      );

    if (cantidad === 0) return libro;

    return {
      ...libro,
      stockVenta: Number(libro.stockVenta) + cantidad,
    };
  });

  localStorage.setItem(
    INVENTARIO_KEY,
    JSON.stringify(actualizados)
  );
}
export function actualizarEstadoPedidoDemo(id, nuevoEstado) {
  const pedidos = obtenerPedidosDemo();

  const pedido = pedidos.find(
    (item) => String(item.id) === String(id)
  );

  if (!pedido) {
    throw new Error("Pedido no encontrado.");
  }

  const transiciones = {
    "Pendiente de confirmación": [
      "Confirmado",
      "Cancelado",
    ],
    "Confirmado": [
      "En preparación",
      "Cancelado",
    ],
    "En preparación": [
      pedido.cliente?.tipoEntrega === "delivery"
        ? "En camino"
        : "Listo para recoger",
      "Cancelado",
    ],
    "Listo para recoger": ["Entregado"],
    "En camino": ["Entregado"],
    "Entregado": [],
    "Cancelado": [],
  };

  if (!transiciones[pedido.estado]?.includes(nuevoEstado)) {
    throw new Error("Cambio de estado no permitido.");
  }

  const actualizados = pedidos.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString(),
        }
      : item
  );

  // Reponer stock únicamente al cancelar un pedido
// que ya había descontado existencias.
if (nuevoEstado === "Cancelado" && pedido.stockDescontado === true) {
  reponerStockVenta(pedido);
}

try {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      actualizados.map((item) =>
        String(item.id) === String(id) &&
        nuevoEstado === "Cancelado"
          ? { ...item, stockDescontado: false }
          : item
      )
    )
  );
} catch (error) {
  // Si falla el guardado del pedido, revertir la reposición.
  if (nuevoEstado === "Cancelado" && pedido.stockDescontado === true) {
    const libros = obtenerLibrosAdminDemo();

    const restaurados = libros.map((libro) => {
      const cantidad = pedido.productos
        .filter((p) => Number(p.id) === Number(libro.id))
        .reduce((total, p) => total + Number(p.cantidad), 0);

      return {
        ...libro,
        stockVenta: Number(libro.stockVenta) - cantidad,
      };
    });

    localStorage.setItem(
      INVENTARIO_KEY,
      JSON.stringify(restaurados)
    );
  }

  throw error;
}

return obtenerPedidosDemo();
}
