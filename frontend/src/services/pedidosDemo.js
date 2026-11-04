
const STORAGE_KEY = "biblionova_pedidos_demo";

export function crearPedidoDemo(datos, items, total) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const pedido = {
    id: crypto.randomUUID(),
    numero: `BN-${Date.now()}`,
    fecha: new Date().toISOString(),
    estado: "Pendiente de confirmación",
    demostracion: true,
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

  const anteriores = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([pedido, ...anteriores])
  );

  return pedido;
}

export function obtenerPedidosDemo() {
  return JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );
}

export const ESTADOS_PEDIDO_DEMO = [
  "Pendiente de confirmación",
  "Confirmado",
  "En preparación",
  "Listo para recoger",
  "En camino",
  "Entregado",
  "Cancelado",
];

export function actualizarEstadoPedidoDemo(id, nuevoEstado) {
  const pedidos = obtenerPedidosDemo();
  const pedido = pedidos.find((p) => String(p.id) === String(id));

  if (!pedido) {
    throw new Error("Pedido no encontrado.");
  }

  const transiciones = {
    "Pendiente de confirmación": ["Confirmado", "Cancelado"],
    "Confirmado": ["En preparación", "Cancelado"],
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

  const actualizados = pedidos.map((p) =>
    String(p.id) === String(id)
      ? {
          ...p,
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString(),
        }
      : p
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(actualizados)
  );

  return actualizados;
}
