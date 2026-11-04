
import { Link } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { obtenerPedidosDemo } from "../../services/pedidosDemo";

export default function MyOrdersPage() {
  const pedidos = obtenerPedidosDemo();

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Mis pedidos
        </h1>

        <p className="mt-2 text-slate-500">
          Consulta el historial de tus compras.
        </p>

        {pedidos.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <ShoppingBag
              size={45}
              className="mx-auto text-stone-300"
            />

            <h2 className="mt-4 text-xl font-bold">
              Todavía no tienes pedidos
            </h2>

            <Link
              to="/catalogo"
              className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800">
                      Pedido {pedido.numero}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(pedido.fecha).toLocaleDateString("es-PE")}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {pedido.estado}
                  </span>
                </div>

                <div className="mt-5 space-y-3 border-t border-stone-100 pt-4">
                  {pedido.productos.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-slate-600">
                        {producto.titulo} × {producto.cantidad}
                      </span>

                      <span className="font-medium">
                        S/ {producto.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Package size={17} />
                    {pedido.cliente.tipoEntrega === "delivery"
                      ? "Delivery"
                      : "Recojo en tienda"}
                  </div>

                  <p className="text-lg font-bold text-[#3D7669]">
                    S/ {pedido.total.toFixed(2)}
                  </p>
                </div>
                <Link
  to={`/mis-pedidos/${pedido.id}`}
  className="mt-5 inline-flex rounded-xl border border-[#3D7669] px-5 py-2.5 text-sm font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4]"
>
  Ver detalle
</Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
