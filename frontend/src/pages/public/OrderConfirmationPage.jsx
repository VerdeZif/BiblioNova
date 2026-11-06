import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  CheckCircle2,
  ShoppingBag,
  Package,
  CreditCard,
  AlertCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import { obtenerPedidoPorId } from "../../services/pedidos";

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatoDinero(valor) {
  return Number(valor ?? 0).toFixed(2);
}

export default function OrderConfirmationPage() {
  const { state } = useLocation();

  const pedidoInicial = state?.pedido ?? null;
  const avisoPago = state?.avisoPago ?? "";

  const [pedido, setPedido] = useState(pedidoInicial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recuperar el identificador del pedido.
  const pedidoId =
      pedidoInicial?.pedidoId ??
      pedidoInicial?.id ??
      sessionStorage.getItem("biblionova_ultimo_pedido_id");

  // Consultar nuevamente el pedido en Spring Boot.
  useEffect(() => {
    let activo = true;

    async function cargarPedido() {
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const resultado = await obtenerPedidoPorId(pedidoId);

        const pedidoReal =
            resultado?.pedido ??
            resultado?.data ??
            resultado;

        if (activo) {
          setPedido(pedidoReal);
        }
      } catch (err) {
        if (activo) {
          setError(
              err.response?.data?.mensaje ||
              "No se pudo actualizar la información del pedido."
          );

          // Si ya teníamos la respuesta de creación,
          // conservamos sus datos para no perder la confirmación.
          if (!pedidoInicial) {
            setPedido(null);
          }
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    cargarPedido();

    return () => {
      activo = false;
    };
  }, [pedidoId, pedidoInicial]);

  const direccion = pedido?.direccion;
  const lineas = Array.isArray(pedido?.lineas)
      ? pedido.lineas
      : [];

  const pagos = Array.isArray(pedido?.pagos)
      ? pedido.pagos
      : [];

  const tipoEntrega =
      String(pedido?.tipoEntrega ?? "").toLowerCase();

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-sm">

            {loading && (
                <p className="py-10 text-center text-slate-500">
                  Consultando información del pedido...
                </p>
            )}

            {!loading && !pedido && (
                <div className="text-center">
                  <AlertCircle
                      size={60}
                      className="mx-auto text-amber-500"
                  />

                  <h1 className="mt-5 text-3xl font-bold text-slate-800">
                    No hay un pedido para mostrar
                  </h1>

                  <p className="mt-3 text-slate-500">
                    No encontramos información de una compra reciente.
                  </p>

                  {error && (
                      <p
                          role="alert"
                          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                      >
                        {error}
                      </p>
                  )}

                  <Link
                      to="/mis-pedidos"
                      className="mt-7 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                  >
                    Consultar mis pedidos
                  </Link>
                </div>
            )}

            {!loading && pedido && (
                <>
                  <CheckCircle2
                      size={64}
                      className="mx-auto text-[#3D7669]"
                  />

                  <h1 className="mt-5 text-center text-3xl font-bold text-slate-800">
                    ¡Pedido registrado!
                  </h1>

                  <p className="mt-3 text-center text-slate-500">
                    Tu pedido fue registrado en BiblioNova correctamente.
                  </p>

                  {avisoPago && (
                      <div
                          role="alert"
                          className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
                      >
                        <AlertCircle
                            size={20}
                            className="shrink-0"
                        />

                        <p>
                          El pedido se creó, pero el pago
                          no pudo completarse: {avisoPago}
                        </p>
                      </div>
                  )}

                  {error && (
                      <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        No se pudo actualizar el detalle desde el
                        servidor. Se muestran los datos recibidos
                        al crear el pedido.
                      </p>
                  )}

                  {/* DATOS DEL PEDIDO */}
                  <div className="mt-8 rounded-xl bg-[#F0F7F4] p-5">
                    <p className="text-sm text-slate-500">
                      Número de pedido
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#3D7669]">
                      {pedido.numeroPedido || `#${pedido.pedidoId}`}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">
                          Total del pedido
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-800">
                          S/ {formatoDinero(pedido.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Fecha del pedido
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {formatearFecha(pedido.fechaPedido)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Estado del pedido
                        </p>

                        <p className="mt-1 font-semibold text-[#3D7669]">
                          {pedido.estado || "Pendiente"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Estado del pago
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {pedido.estadoPago || "Pendiente"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MODALIDAD DE ENTREGA */}
                  <section className="mt-7">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                      <Package size={20} />
                      Información de entrega
                    </h2>

                    <div className="mt-3 rounded-xl border border-stone-200 p-4">
                      <p className="font-semibold text-slate-800">
                        {pedido.tipoEntrega === "Delivery"
                            ? "Delivery"
                            : "Recojo en tienda"}
                      </p>

                      {pedido.tipoEntrega === "Delivery" &&
                          direccion && (
                              <div className="mt-3 text-sm leading-6 text-slate-600">
                                <p>
                                  {direccion.destinatario}
                                </p>

                                <p>
                                  {direccion.direccion}
                                </p>

                                <p>
                                  {[
                                    direccion.distrito,
                                    direccion.provincia,
                                    direccion.departamento,
                                  ]
                                      .filter(Boolean)
                                      .join(", ")}
                                </p>

                                {direccion.referencia && (
                                    <p>
                                      Referencia: {direccion.referencia}
                                    </p>
                                )}

                                {direccion.telefono && (
                                    <p>
                                      Teléfono: {direccion.telefono}
                                    </p>
                                )}
                              </div>
                          )}

                      {pedido.tipoEntrega === "Recojo" && (
                          <div className="mt-3 text-sm text-slate-600">
                            {pedido.puntoRecojo && (
                                <p>
                                  Punto de recojo: {pedido.puntoRecojo}
                                </p>
                            )}

                            {pedido.plazoRecojo && (
                                <p>
                                  Plazo: {formatearFecha(pedido.plazoRecojo)}
                                </p>
                            )}
                          </div>
                      )}
                    </div>
                  </section>

                  {/* PRODUCTOS */}
                  <section className="mt-7">
                    <h2 className="text-lg font-bold text-slate-800">
                      Productos del pedido
                    </h2>

                    <div className="mt-3 space-y-3">
                      {lineas.map((linea, index) => (
                          <div
                              key={
                                  linea.detallePedidoId ??
                                  `${linea.libro?.id ?? index}-${index}`
                              }
                              className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 p-4"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">
                                {linea.libro?.nombre || "Libro"}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Cantidad: {linea.cantidad}
                              </p>
                            </div>

                            <p className="font-semibold text-[#3D7669]">
                              S/ {formatoDinero(linea.importe)}
                            </p>
                          </div>
                      ))}

                      {lineas.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No hay información de productos disponible.
                          </p>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Subtotal
                                        </span>

                        <span>
                                            S/ {formatoDinero(pedido.subtotal)}
                                        </span>
                      </div>

                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Impuesto
                                        </span>

                        <span>
                                            S/ {formatoDinero(pedido.impuesto)}
                                        </span>
                      </div>

                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Envío
                                        </span>

                        <span>
                                            S/ {formatoDinero(pedido.costoEnvio)}
                                        </span>
                      </div>

                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Descuento
                                        </span>

                        <span>
                                            S/ {formatoDinero(pedido.descuento)}
                                        </span>
                      </div>

                      <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
                        <span>Total</span>

                        <span className="text-[#3D7669]">
                                            S/ {formatoDinero(pedido.total)}
                                        </span>
                      </div>
                    </div>
                  </section>

                  {/* PAGOS */}
                  {pagos.length > 0 && (
                      <section className="mt-7">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                          <CreditCard size={20} />
                          Información de pago
                        </h2>

                        <div className="mt-3 space-y-3">
                          {pagos.map((pago) => (
                              <div
                                  key={
                                      pago.pagoPedidoId ??
                                      pago.pagoId
                                  }
                                  className="rounded-xl border border-stone-200 p-4"
                              >
                                <div className="flex justify-between gap-3">
                                                    <span className="font-medium text-slate-700">
                                                        {pago.metodo ||
                                                            pago.metodoCodigo}
                                                    </span>

                                  <span className="font-semibold text-[#3D7669]">
                                                        {pago.estado}
                                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                  Monto: S/ {formatoDinero(pago.monto)}
                                </p>
                              </div>
                          ))}
                        </div>
                      </section>
                  )}

                  <div className="mt-9 grid gap-3 sm:grid-cols-2">
                    <Link
                        to="/mis-pedidos"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3D7669] px-6 py-3 font-semibold text-[#3D7669]"
                    >
                      <Package size={18} />
                      Mis pedidos
                    </Link>

                    <Link
                        to="/catalogo"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                    >
                      <ShoppingBag size={18} />
                      Volver al catálogo
                    </Link>
                  </div>
                </>
            )}
          </div>
        </main>
      </div>
  );
}