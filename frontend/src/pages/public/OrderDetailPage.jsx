
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, MapPin, UserRound } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { obtenerPedidosDemo } from "../../services/pedidosDemo";

export default function OrderDetailPage() {
  const { id } = useParams();

  const pedido = obtenerPedidosDemo().find(
    (item) => String(item.id) === id
  );

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />
        <main className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">
            Pedido no encontrado
          </h1>
          <Link
            to="/mis-pedidos"
            className="mt-5 inline-block text-[#3D7669]"
          >
            Volver a mis pedidos
          </Link>
        </main>
      </div>
    );
  }

  const cliente = pedido.cliente || {};
  const productos = pedido.productos || [];
  const delivery = cliente.tipoEntrega === "delivery";

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <Link
          to="/mis-pedidos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
        >
          <ArrowLeft size={17} />
          Volver a mis pedidos
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Pedido {pedido.numero}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {new Date(pedido.fecha).toLocaleString("es-PE")}
            </p>
          </div>

          <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            {pedido.estado}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Package size={21} className="text-[#3D7669]" />
                Productos
              </h2>

              <div className="mt-5 space-y-4">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex justify-between gap-4 border-b border-stone-100 pb-4 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {producto.titulo}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {producto.cantidad} × S/ {producto.precio.toFixed(2)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      S/ {producto.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <UserRound size={21} className="text-[#3D7669]" />
                Datos del comprador
              </h2>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{cliente.nombres} {cliente.apellidos}</p>
                <p>{cliente.correo}</p>
                <p>{cliente.telefono}</p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin size={21} className="text-[#3D7669]" />
                Entrega y pago
              </h2>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  Entrega: {delivery ? "Delivery" : "Recojo en tienda"}
                </p>
                <p>
                  Pago: {cliente.metodoPago === "contraentrega"
                    ? "Contraentrega"
                    : cliente.metodoPago === "tienda"
                      ? "Pago en tienda"
                      : "Otro"}
                </p>

                {delivery && (
                  <>
                    <p>Dirección: {cliente.direccion}</p>
                    <p>Distrito: {cliente.distrito}</p>
                    {cliente.referencia && (
                      <p>Referencia: {cliente.referencia}</p>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Resumen
            </h2>

            <div className="mt-5 flex justify-between border-t border-stone-100 pt-5 text-xl font-bold">
              <span>Total</span>
              <span className="text-[#3D7669]">
                S/ {pedido.total.toFixed(2)}
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Pedido de demostración. No representa una compra real.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
