
import { useState } from "react";
import {
  Package,
  Search,
  Eye,
  X,
  CheckCircle2,
  Clock3,
  Truck,
} from "lucide-react";

import {
  obtenerPedidosDemo,
  actualizarEstadoPedidoDemo,
  ESTADOS_PEDIDO_DEMO,
} from "../../services/pedidosDemo";

const siguientesEstados = {
  "Pendiente de confirmación": ["Confirmado", "Cancelado"],
  "Confirmado": ["En preparación", "Cancelado"],
  "En preparación": ["Cancelado"],
  "Listo para recoger": ["Entregado"],
  "En camino": ["Entregado"],
  "Entregado": [],
  "Cancelado": [],
};

export default function AdminOrdersPage() {
  const [pedidos, setPedidos] = useState(
    () => obtenerPedidosDemo()
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [error, setError] = useState("");

  const totalVentas = pedidos
    .filter((p) => p.estado !== "Cancelado")
    .reduce((total, p) => total + Number(p.total || 0), 0);

  const pendientes = pedidos.filter(
    (p) => p.estado === "Pendiente de confirmación"
  ).length;

  const entregados = pedidos.filter(
    (p) => p.estado === "Entregado"
  ).length;

  const filtrados = pedidos.filter((pedido) => {
    const texto = [
      pedido.numero,
      pedido.cliente?.nombres,
      pedido.cliente?.apellidos,
      pedido.cliente?.correo,
    ]
      .join(" ")
      .toLowerCase();

    return (
      texto.includes(busqueda.toLowerCase()) &&
      (filtro === "Todos" || pedido.estado === filtro)
    );
  });

  const cambiarEstado = (pedido, nuevoEstado) => {
    try {
      setError("");

      const actualizados = actualizarEstadoPedidoDemo(
        pedido.id,
        nuevoEstado
      );

      setPedidos(actualizados);
      setSeleccionado(
        actualizados.find((p) => p.id === pedido.id) || null
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const opcionesEstado = (pedido) => {
    if (pedido.estado === "En preparación") {
      return [
        pedido.cliente?.tipoEntrega === "delivery"
          ? "En camino"
          : "Listo para recoger",
        "Cancelado",
      ];
    }

    return siguientesEstados[pedido.estado] || [];
  };

  const fecha = (valor) =>
    valor
      ? new Date(valor).toLocaleDateString("es-PE")
      : "Sin fecha";

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div>
        <p className="text-sm font-semibold text-[#3D7669]">
          Administración
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Gestión de pedidos
        </h1>
        <p className="mt-2 text-slate-500">
          Consulta las compras y administra su seguimiento.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { titulo: "Total pedidos", valor: pedidos.length, icono: Package },
          { titulo: "Pendientes", valor: pendientes, icono: Clock3 },
          { titulo: "Entregados", valor: entregados, icono: CheckCircle2 },
          {
            titulo: "Importe no cancelado",
            valor: `S/ ${totalVentas.toFixed(2)}`,
            icono: Truck,
          },
        ].map(({ titulo, valor, icono: Icon }) => (
          <div
            key={titulo}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{titulo}</p>
              <Icon size={20} className="text-[#3D7669]" />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-800">
              {valor}
            </p>
          </div>
        ))}
      </section>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-stone-200 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar pedido o cliente..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-3 text-sm"
          >
            <option value="Todos">Todos los estados</option>
            {ESTADOS_PEDIDO_DEMO.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-slate-500">
              <tr>
                <th className="pb-4">Pedido</th>
                <th className="pb-4">Cliente</th>
                <th className="pb-4">Fecha</th>
                <th className="pb-4">Total</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((pedido) => (
                <tr
                  key={pedido.id}
                  className="border-b border-stone-100"
                >
                  <td className="py-4 font-semibold text-slate-800">
                    {pedido.numero}
                  </td>

                  <td className="py-4">
                    {pedido.cliente?.nombres}{" "}
                    {pedido.cliente?.apellidos}
                  </td>

                  <td className="py-4">{fecha(pedido.fecha)}</td>

                  <td className="py-4 font-semibold">
                    S/ {Number(pedido.total || 0).toFixed(2)}
                  </td>

                  <td className="py-4">
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#3D7669]">
                      {pedido.estado}
                    </span>
                  </td>

                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSeleccionado(pedido);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[#3D7669] hover:bg-emerald-50"
                    >
                      <Eye size={17} />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <p className="py-10 text-center text-slate-500">
              No se encontraron pedidos.
            </p>
          )}
        </div>
      </section>

      {seleccionado && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detalle del pedido"
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Pedido {seleccionado.numero}
              </h2>
              <button
                type="button"
                onClick={() => setSeleccionado(null)}
                aria-label="Cerrar detalle"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="font-bold text-slate-800">
                  Información del cliente
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {seleccionado.cliente?.nombres}{" "}
                  {seleccionado.cliente?.apellidos}
                </p>
                <p className="text-sm text-slate-600">
                  {seleccionado.cliente?.correo}
                </p>
                <p className="text-sm text-slate-600">
                  {seleccionado.cliente?.telefono}
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-800">
                  Entrega y pago
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Modalidad: {seleccionado.cliente?.tipoEntrega}
                </p>
                <p className="text-sm text-slate-600">
                  Pago: {seleccionado.cliente?.metodoPago}
                </p>
                <p className="text-sm text-slate-600">
                  Dirección: {seleccionado.cliente?.direccion || "Recojo en tienda"}
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-800">
                  Productos
                </h3>
                <div className="mt-3 space-y-3">
                  {(seleccionado.productos || []).map((producto, index) => (
                    <div
                      key={`${producto.id}-${index}`}
                      className="flex justify-between gap-4 border-b border-stone-100 pb-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          {producto.titulo}
                        </p>
                        <p className="text-slate-500">
                          Cantidad: {producto.cantidad}
                        </p>
                      </div>
                      <span>
                        S/ {Number(producto.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-right text-xl font-bold text-[#3D7669]">
                  Total: S/ {Number(seleccionado.total).toFixed(2)}
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-800">
                  Estado del pedido
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Estado actual:{" "}
                  <strong>{seleccionado.estado}</strong>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {opcionesEstado(seleccionado).map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      onClick={() => cambiarEstado(seleccionado, estado)}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                        estado === "Cancelado"
                          ? "bg-red-50 text-red-700"
                          : "bg-[#3D7669] text-white"
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>

                {opcionesEstado(seleccionado).length === 0 && (
                  <p className="mt-3 text-sm text-slate-500">
                    Este pedido no tiene más cambios disponibles.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
