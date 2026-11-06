import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import {
    Package,
    ShoppingBag,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import { obtenerMisPedidos } from "../../services/pedidos";

function extraerPedidos(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;

    return [];
}

function formatoDinero(valor) {
    return Number(valor ?? 0).toFixed(2);
}

function formatearFecha(fecha) {
    if (!fecha) return "Fecha no disponible";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
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
            return "bg-[#F0F7F4] text-[#254E46]";

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

export default function MyOrdersPage() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Consultar pedidos del cliente autenticado con useCallback
    const cargarPedidos = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const respuesta = await obtenerMisPedidos();

            setPedidos(extraerPedidos(respuesta));
        } catch (err) {
            setPedidos([]);

            setError(
                err.response?.data?.mensaje ||
                err.message ||
                "No se pudieron cargar tus pedidos."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarPedidos();
    }, [cargarPedidos]);

    return (
        <div className="min-h-screen bg-[#F8F6F1]">
            <Navbar />

            <main className="mx-auto max-w-5xl px-5 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Mis pedidos
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Consulta el historial de tus compras.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cargarPedidos}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#3D7669] px-4 py-2.5 text-sm font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4] disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Actualizar
                    </button>
                </div>

                {/* CARGANDO */}
                {loading && (
                    <div className="mt-10 rounded-2xl bg-white p-12 text-center">
                        <RefreshCw
                            size={35}
                            className="mx-auto animate-spin text-[#3D7669]"
                        />

                        <p className="mt-4 text-slate-500">
                            Cargando tus pedidos...
                        </p>
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div
                        role="alert"
                        className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle
                                size={22}
                                className="shrink-0 text-red-600"
                            />

                            <div>
                                <h2 className="font-semibold text-red-800">
                                    No se pudieron cargar tus pedidos
                                </h2>

                                <p className="mt-1 text-sm text-red-700">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={cargarPedidos}
                                    className="mt-3 text-sm font-semibold text-red-800 underline"
                                >
                                    Intentar nuevamente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SIN PEDIDOS */}
                {!loading && !error && pedidos.length === 0 && (
                    <div className="mt-8 rounded-2xl bg-white p-10 text-center">
                        <ShoppingBag
                            size={45}
                            className="mx-auto text-stone-300"
                        />

                        <h2 className="mt-4 text-xl font-bold text-slate-800">
                            Todavía no tienes pedidos
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Cuando realices una compra, aparecerá aquí.
                        </p>

                        <Link
                            to="/catalogo"
                            className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white transition hover:bg-[#315e55]"
                        >
                            Explorar catálogo
                        </Link>
                    </div>
                )}

                {/* LISTADO REAL */}
                {!loading && !error && pedidos.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {pedidos.map((pedido) => {
                            const pedidoId = pedido.pedidoId ?? pedido.id;

                            const lineas = Array.isArray(pedido.lineas)
                                ? pedido.lineas
                                : [];

                            const esDelivery = pedido.tipoEntrega === "Delivery";

                            return (
                                <article
                                    key={pedidoId}
                                    className="rounded-2xl bg-white p-6 shadow-sm"
                                >
                                    {/* CABECERA */}
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-slate-800">
                                                Pedido {pedido.numeroPedido || `#${pedidoId}`}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {formatearFecha(pedido.fechaPedido)}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                                                pedido.estado
                                            )}`}
                                        >
                      {pedido.estado || "Pendiente"}
                    </span>
                                    </div>

                                    {/* PRODUCTOS */}
                                    <div className="mt-5 space-y-3 border-t border-stone-100 pt-4">
                                        {lineas.map((linea, index) => {
                                            const nombre =
                                                linea.libro?.nombre ||
                                                linea.titulo ||
                                                "Libro";

                                            const importe =
                                                linea.importe ??
                                                Number(linea.precioUnitario ?? 0) *
                                                Number(linea.cantidad ?? 0);

                                            return (
                                                <div
                                                    key={
                                                        linea.detallePedidoId ??
                                                        `${linea.libro?.id ?? index}-${index}`
                                                    }
                                                    className="flex items-center justify-between gap-4 text-sm"
                                                >
                          <span className="text-slate-600">
                            {nombre} × {linea.cantidad}
                          </span>

                                                    <span className="font-medium text-slate-800">
                            S/ {formatoDinero(importe)}
                          </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* MODALIDAD Y PAGO */}
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Package size={17} />

                                                {esDelivery ? "Delivery" : "Recojo en tienda"}
                                            </div>

                                            <p className="text-sm">
                                                Pago:{" "}
                                                <span
                                                    className={`font-semibold ${colorEstadoPago(
                                                        pedido.estadoPago
                                                    )}`}
                                                >
                          {pedido.estadoPago || "Pendiente"}
                        </span>
                                            </p>
                                        </div>

                                        <p className="text-lg font-bold text-[#3D7669]">
                                            S/ {formatoDinero(pedido.total)}
                                        </p>
                                    </div>

                                    {/* DETALLE */}
                                    <Link
                                        to={`/mis-pedidos/${pedidoId}`}
                                        className="mt-5 inline-flex rounded-xl border border-[#3D7669] px-5 py-2.5 text-sm font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4]"
                                    >
                                        Ver detalle
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}