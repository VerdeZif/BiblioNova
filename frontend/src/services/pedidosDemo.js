
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
