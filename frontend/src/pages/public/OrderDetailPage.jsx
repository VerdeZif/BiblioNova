import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Package,
  MapPin,
  UserRound,
  CreditCard,
  Truck,
  Store,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import { obtenerPedidoPorId } from "../../services/pedidos";

function formatoDinero(valor) {
  return Number(valor ?? 0).toFixed(2);
}

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

function colorEstado(estado) {
  switch (estado) {
    case "Entregado":
    case "ListoRecojo":
      return "bg-emerald-50 text-emerald-700";

    case "Cancelado":
      return "bg-red-50 text-red-700";

    case "Preparando":
    case "Despachado":
      return "bg-blue-50 text-blue-700";

    case "Confirmado":
      return "bg-indigo-50 text-indigo-700";

    case "Pendiente":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function colorEstadoPago(estado) {
  switch (estado) {
    case "Pagado":
      return "text-emerald-700";

    case "Fallido":
    case "Reembolsado":
      return "text-red-600";

    case "Parcial":
      return "text-blue-700";

    case "Pendiente":
    default:
      return "text-amber-700";
  }
}

export default function OrderDetailPage() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Consultar el pedido real.
  useEffect(() => {
    let activo = true;

    async function cargarPedido() {
      try {
        setLoading(true);
        setError("");
        setPedido(null);

        const resultado = await obtenerPedidoPorId(id);

        const pedidoReal =
            resultado?.pedido ??
            resultado?.data ??
            resultado;

        if (!activo) return;

        // Comprobar que la respuesta corresponda al pedido solicitado.
        const pedidoId =
            pedidoReal?.pedidoId ??
            pedidoReal?.id;

        if (
            !pedidoReal ||
            String(pedidoId) !== String(id)
        ) {
          throw new Error(
              "El servidor no devolvió el pedido solicitado."
          );
        }

        setPedido(pedidoReal);
      } catch (err) {
        if (activo) {
          setPedido(null);

          setError(
              err.response?.data?.mensaje ||
              err.message ||
              "No se pudo cargar el pedido."
          );
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
  }, [id]);

  // Estado de carga.
  if (loading) {
    return (
        <div className="min-h-screen bg-[#F8F6F1]">
          <Navbar />

          <main className="mx-auto max-w-4xl px-5 py-20 text-center">
            <RefreshCw
                size={38}
                className="mx-auto animate-spin text-[#3D7669]"
            />

            <p className="mt-4 text-slate-500">
              Cargando información del pedido...
            </p>
          </main>
        </div>
    );
  }

  // Estado de error o pedido no encontrado.
  if (!pedido) {
    return (
        <div className="min-h-screen bg-[#F8F6F1]">
          <Navbar />

          <main className="mx-auto max-w-4xl px-5 py-16 text-center">
            <AlertCircle
                size={55}
                className="mx-auto text-amber-500"
            />

            <h1 className="mt-5 text-2xl font-bold text-slate-800">
              No se pudo encontrar el pedido
            </h1>

            <p
                role="alert"
                className="mt-3 text-sm text-red-600"
            >
              {error || "El pedido solicitado no existe."}
            </p>

            <Link
                to="/mis-pedidos"
                className="mt-6 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
            >
              Volver a mis pedidos
            </Link>
          </main>
        </div>
    );
  }

  // Datos reales del pedido.
  const lector = pedido.lector ?? {};
  const direccion = pedido.direccion ?? {};
  const envio = pedido.envio ?? {};

  const productos = Array.isArray(pedido.lineas)
      ? pedido.lineas
      : [];

  const pagos = Array.isArray(pedido.pagos)
      ? pedido.pagos
      : [];

  const delivery = pedido.tipoEntrega === "Delivery";

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main className="mx-auto max-w-5xl px-5 py-10">

          {/* REGRESAR */}
          <Link
              to="/mis-pedidos"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
          >
            <ArrowLeft size={17} />
            Volver a mis pedidos
          </Link>

          {/* ENCABEZADO */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Pedido {pedido.numeroPedido || `#${pedido.pedidoId}`}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {formatearFecha(pedido.fechaPedido)}
              </p>
            </div>

            <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${colorEstado(
                    pedido.estado
                )}`}
            >
                        {pedido.estado || "Pendiente"}
                    </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">

            <div className="space-y-6 lg:col-span-2">

              {/* PRODUCTOS */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Package
                      size={21}
                      className="text-[#3D7669]"
                  />
                  Productos
                </h2>

                <div className="mt-5 space-y-4">
                  {productos.map((producto, index) => (
                      <div
                          key={
                              producto.detallePedidoId ??
                              `${producto.libro?.id ?? index}-${index}`
                          }
                          className="flex justify-between gap-4 border-b border-stone-100 pb-4 text-sm last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {producto.libro?.nombre || "Libro"}
                          </p>

                          <p className="mt-1 text-slate-500">
                            {producto.cantidad} × S/{" "}
                            {formatoDinero(
                                producto.precioUnitario
                            )}
                          </p>
                        </div>

                        <p className="font-semibold text-slate-800">
                          S/ {formatoDinero(producto.importe)}
                        </p>
                      </div>
                  ))}

                  {productos.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No hay productos disponibles para mostrar.
                      </p>
                  )}
                </div>
              </section>

              {/* DATOS DEL CLIENTE */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <UserRound
                      size={21}
                      className="text-[#3D7669]"
                  />
                  Datos del comprador
                </h2>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                                    <span className="font-semibold">
                                        Nombre:
                                    </span>{" "}
                    {lector.nombre || "No disponible"}
                  </p>

                  {lector.id && (
                      <p>
                                        <span className="font-semibold">
                                            Identificador del lector:
                                        </span>{" "}
                        {lector.id}
                      </p>
                  )}
                </div>
              </section>

              {/* ENTREGA */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  {delivery ? (
                      <MapPin
                          size={21}
                          className="text-[#3D7669]"
                      />
                  ) : (
                      <Store
                          size={21}
                          className="text-[#3D7669]"
                      />
                  )}
                  Entrega
                </h2>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                                    <span className="font-semibold">
                                        Modalidad:
                                    </span>{" "}
                    {delivery
                        ? "Delivery"
                        : "Recojo en tienda"}
                  </p>

                  {delivery ? (
                      <>
                        <p>
                                            <span className="font-semibold">
                                                Destinatario:
                                            </span>{" "}
                          {direccion.destinatario ||
                              "No disponible"}
                        </p>

                        <p>
                                            <span className="font-semibold">
                                                Dirección:
                                            </span>{" "}
                          {direccion.direccion ||
                              "No disponible"}
                        </p>

                        <p>
                                            <span className="font-semibold">
                                                Distrito:
                                            </span>{" "}
                          {direccion.distrito || "No disponible"}
                        </p>

                        <p>
                                            <span className="font-semibold">
                                                Provincia:
                                            </span>{" "}
                          {direccion.provincia || "No disponible"}
                        </p>

                        <p>
                                            <span className="font-semibold">
                                                Departamento:
                                            </span>{" "}
                          {direccion.departamento || "No disponible"}
                        </p>

                        {direccion.referencia && (
                            <p>
                                                <span className="font-semibold">
                                                    Referencia:
                                                </span>{" "}
                              {direccion.referencia}
                            </p>
                        )}

                        {direccion.telefono && (
                            <p>
                                                <span className="font-semibold">
                                                    Teléfono:
                                                </span>{" "}
                              {direccion.telefono}
                            </p>
                        )}
                      </>
                  ) : (
                      <>
                        {pedido.puntoRecojo && (
                            <p>
                                                <span className="font-semibold">
                                                    Punto de recojo:
                                                </span>{" "}
                              {pedido.puntoRecojo}
                            </p>
                        )}

                        {pedido.plazoRecojo && (
                            <p>
                                                <span className="font-semibold">
                                                    Plazo:
                                                </span>{" "}
                              {formatearFecha(
                                  pedido.plazoRecojo
                              )}
                            </p>
                        )}

                        {pedido.plazoRecojoVencido && (
                            <p className="font-medium text-red-600">
                              El plazo de recojo ha vencido.
                            </p>
                        )}
                      </>
                  )}

                  {delivery && envio.estado && (
                      <div className="mt-4 border-t border-stone-100 pt-4">
                        <h3 className="font-semibold text-slate-800">
                          Seguimiento del envío
                        </h3>

                        <p className="mt-2">
                          Estado: {envio.estado}
                        </p>

                        {envio.operador && (
                            <p>
                              Operador: {envio.operador}
                            </p>
                        )}

                        {envio.codigoSeguimiento && (
                            <p>
                              Código de seguimiento:{" "}
                              {envio.codigoSeguimiento}
                            </p>
                        )}

                        {envio.fechaDespacho && (
                            <p>
                              Fecha de despacho:{" "}
                              {formatearFecha(
                                  envio.fechaDespacho
                              )}
                            </p>
                        )}

                        {envio.fechaEntrega && (
                            <p>
                              Fecha de entrega:{" "}
                              {formatearFecha(
                                  envio.fechaEntrega
                              )}
                            </p>
                        )}
                      </div>
                  )}
                </div>
              </section>

              {/* PAGOS */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <CreditCard
                      size={21}
                      className="text-[#3D7669]"
                  />
                  Información de pago
                </h2>

                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Estado general del pago:{" "}
                    <span
                        className={`font-semibold ${colorEstadoPago(
                            pedido.estadoPago
                        )}`}
                    >
                                        {pedido.estadoPago || "Pendiente"}
                                    </span>
                  </p>

                  {pagos.map((pago, index) => (
                      <div
                          key={
                              pago.pagoPedidoId ??
                              `${pago.metodoCodigo}-${index}`
                          }
                          className="rounded-xl border border-stone-200 p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <p className="font-semibold text-slate-800">
                            {pago.metodo ||
                                pago.metodoCodigo ||
                                "Método de pago"}
                          </p>

                          <span
                              className={`text-sm font-semibold ${colorEstadoPago(
                                  pago.estado
                              )}`}
                          >
                                                {pago.estado}
                                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Monto: S/ {formatoDinero(pago.monto)}
                        </p>

                        {pago.fechaConfirmacion && (
                            <p className="mt-1 text-xs text-slate-400">
                              Confirmado:{" "}
                              {formatearFecha(
                                  pago.fechaConfirmacion
                              )}
                            </p>
                        )}
                      </div>
                  ))}

                  {pagos.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No hay información de pagos disponible.
                      </p>
                  )}
                </div>
              </section>
            </div>

            {/* RESUMEN */}
            <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">
                Resumen del pedido
              </h2>

              <div className="mt-5 space-y-3 border-t border-stone-100 pt-5 text-sm">
                <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                    Subtotal
                                </span>

                  <span>
                                    S/ {formatoDinero(pedido.subtotal)}
                                </span>
                </div>

                <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                    Impuesto
                                </span>

                  <span>
                                    S/ {formatoDinero(pedido.impuesto)}
                                </span>
                </div>

                <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                    Envío
                                </span>

                  <span>
                                    S/ {formatoDinero(pedido.costoEnvio)}
                                </span>
                </div>

                <div className="flex justify-between gap-3">
                                <span className="text-slate-500">
                                    Descuento
                                </span>

                  <span>
                                    S/ {formatoDinero(pedido.descuento)}
                                </span>
                </div>
              </div>

              <div className="mt-5 flex justify-between border-t border-stone-100 pt-5 text-xl font-bold">
                <span>Total</span>

                <span className="text-[#3D7669]">
                                S/ {formatoDinero(pedido.total)}
                            </span>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Esta información corresponde al pedido registrado
                en el servidor.
              </p>

              <Link
                  to="/mis-pedidos"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#3D7669] px-4 py-3 text-sm font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4]"
              >
                <ArrowLeft size={16} />
                Volver a mis pedidos
              </Link>
            </aside>
          </div>
        </main>
      </div>
  );
}