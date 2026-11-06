import { useCallback, useEffect, useState } from "react";
import {
    BadgeCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Eye,
    FileText,
    Loader2,
    RefreshCw,
    ShoppingBag,
    UserRound,
    X,
} from "lucide-react";

import {
    listarVentasVendedor,
    obtenerVentaVendedor,
} from "../../services/ventasVendedor";

const COLOR_PRINCIPAL = "#3D7669";
const TAMANO_PAGINA = 10;

function formatoDinero(valor) {
    const numero = Number(valor ?? 0);
    return `S/ ${Number.isFinite(numero) ? numero.toFixed(2) : "0.00"}`;
}

function formatoFecha(valor) {
    if (!valor) return "—";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return String(valor);

    return fecha.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function obtenerMensajeError(error) {
    return (
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        error?.message ||
        "Ocurrió un error al consultar las ventas."
    );
}

function EtiquetaEstado({ estado }) {
    const texto = estado || "Sin estado";
    const normalizado = texto.toLowerCase();

    let clases =
        "border-stone-200 bg-stone-100 text-stone-700";

    if (
        ["completada", "completado", "confirmada", "confirmado"]
            .includes(normalizado)
    ) {
        clases =
            "border-emerald-200 bg-emerald-50 text-emerald-700";
    } else if (normalizado.includes("anulad")) {
        clases = "border-red-200 bg-red-50 text-red-700";
    } else if (normalizado.includes("pendiente")) {
        clases = "border-amber-200 bg-amber-50 text-amber-700";
    }

    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${clases}`}
        >
      {texto}
    </span>
    );
}

function DatoDetalle({ titulo, valor }) {
    return (
        <div className="rounded-xl bg-[#F8F6F1] p-4">
            <p className="text-xs font-medium text-slate-500">
                {titulo}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {valor ?? "—"}
            </p>
        </div>
    );
}

export default function VendorSalesPage() {
    const [ventas, setVentas] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [detalle, setDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);

    const cargarVentas = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const respuesta = await listarVentasVendedor({
                page: pagina,
                size: TAMANO_PAGINA,
            });

            if (!Array.isArray(respuesta?.contenido)) {
                throw new Error(
                    "La API devolvió un formato de ventas inesperado."
                );
            }

            setVentas(respuesta.contenido);
            setTotalPaginas(Number(respuesta.totalPaginas ?? 0));
            setTotalElementos(Number(respuesta.totalElementos ?? 0));
        } catch (err) {
            setVentas([]);
            setError(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
    }, [pagina]);

    useEffect(() => {
        cargarVentas();
    }, [cargarVentas]);

    const verDetalle = async (ventaId) => {
        setModalAbierto(true);
        setCargandoDetalle(true);
        setDetalle(null);
        setErrorDetalle("");

        try {
            const respuesta = await obtenerVentaVendedor(ventaId);
            setDetalle(respuesta);
        } catch (err) {
            setErrorDetalle(obtenerMensajeError(err));
        } finally {
            setCargandoDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setModalAbierto(false);
        setDetalle(null);
        setErrorDetalle("");
    };

    return (
        <div className="space-y-6 pb-12">
            {/* ENCABEZADO */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-[#3D7669]">
                        <ShoppingBag size={17} />
                        Panel del vendedor
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                        Consultar ventas
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Consulta las ventas registradas y revisa sus detalles.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={cargarVentas}
                    disabled={cargando}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={17}
                        className={cargando ? "animate-spin" : ""}
                    />
                    Actualizar
                </button>
            </div>

            {/* RESUMEN */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Ventas registradas
                        </p>

                        <ShoppingBag
                            size={22}
                            color={COLOR_PRINCIPAL}
                        />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-slate-800">
                        {totalElementos}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Total de resultados de la consulta
                    </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Página actual
                        </p>

                        <FileText size={22} color={COLOR_PRINCIPAL} />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-slate-800">
                        {totalPaginas === 0 ? 0 : pagina + 1}
                        <span className="text-lg font-normal text-slate-400">
              {" / "}{totalPaginas}
            </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {TAMANO_PAGINA} ventas por página
                    </p>
                </div>
            </div>

            {/* TABLA */}
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-200 px-5 py-4">
                    <h2 className="font-bold text-slate-800">
                        Historial de ventas
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Información obtenida desde Spring Boot
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {cargando ? (
                    <div className="flex min-h-64 items-center justify-center gap-3">
                        <Loader2
                            size={24}
                            className="animate-spin text-[#3D7669]"
                        />
                        <p className="text-sm text-slate-500">
                            Cargando ventas...
                        </p>
                    </div>
                ) : ventas.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <ShoppingBag
                            size={40}
                            className="mx-auto text-stone-300"
                        />
                        <p className="mt-3 font-semibold text-slate-700">
                            No hay ventas para mostrar
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Las ventas registradas aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-[#F8F6F1] text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Venta</th>
                                <th className="px-5 py-4">Fecha</th>
                                <th className="px-5 py-4">Cliente</th>
                                <th className="px-5 py-4">Canal</th>
                                <th className="px-5 py-4">Estado</th>
                                <th className="px-5 py-4">Total</th>
                                <th className="px-5 py-4 text-right">
                                    Acción
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-stone-100">
                            {ventas.map((venta) => (
                                <tr
                                    key={venta.ventaId}
                                    className="hover:bg-stone-50"
                                >
                                    <td className="px-5 py-4 font-semibold text-slate-800">
                                        {venta.numeroVenta}
                                    </td>

                                    <td className="px-5 py-4 text-slate-600">
                                        {formatoFecha(venta.fechaVenta)}
                                    </td>

                                    <td className="px-5 py-4 text-slate-600">
                                        {venta.lector?.nombre ||
                                            "Cliente no asociado"}
                                    </td>

                                    <td className="px-5 py-4 text-slate-600">
                                        {venta.canal}
                                    </td>

                                    <td className="px-5 py-4">
                                        <EtiquetaEstado estado={venta.estado} />
                                    </td>

                                    <td className="px-5 py-4 font-bold text-[#3D7669]">
                                        {formatoDinero(venta.total)}
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => verDetalle(venta.ventaId)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#3D7669]/10 px-3 py-2 text-xs font-semibold text-[#3D7669] hover:bg-[#3D7669]/20"
                                        >
                                            <Eye size={16} />
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINACIÓN */}
                <div className="flex items-center justify-between gap-4 border-t border-stone-200 px-5 py-4">
                    <p className="text-sm text-slate-500">
                        {totalElementos} resultado(s)
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={cargando || pagina === 0}
                            onClick={() =>
                                setPagina((actual) => Math.max(0, actual - 1))
                            }
                            className="rounded-lg border border-stone-200 p-2 text-slate-700 disabled:opacity-40"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft size={19} />
                        </button>

                        <button
                            type="button"
                            disabled={
                                cargando ||
                                totalPaginas === 0 ||
                                pagina + 1 >= totalPaginas
                            }
                            onClick={() =>
                                setPagina((actual) => actual + 1)
                            }
                            className="rounded-lg border border-stone-200 p-2 text-slate-700 disabled:opacity-40"
                            aria-label="Página siguiente"
                        >
                            <ChevronRight size={19} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE DETALLE */}
            {modalAbierto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={cerrarDetalle}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle de venta"
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Detalle de venta
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {detalle?.numeroVenta || "Consultando..."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarDetalle}
                                aria-label="Cerrar detalle"
                                className="rounded-lg p-2 text-slate-500 hover:bg-stone-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            {cargandoDetalle && (
                                <div className="flex items-center justify-center gap-3 py-16">
                                    <Loader2 className="animate-spin text-[#3D7669]" />
                                    <span className="text-slate-500">
                    Cargando detalle...
                  </span>
                                </div>
                            )}

                            {errorDetalle && (
                                <p
                                    role="alert"
                                    className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {errorDetalle}
                                </p>
                            )}

                            {detalle && (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Número de venta
                                            </p>
                                            <h3 className="text-xl font-bold text-[#3D7669]">
                                                {detalle.numeroVenta}
                                            </h3>
                                        </div>

                                        <EtiquetaEstado estado={detalle.estado} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <DatoDetalle
                                            titulo="Fecha de venta"
                                            valor={formatoFecha(detalle.fechaVenta)}
                                        />
                                        <DatoDetalle
                                            titulo="Canal"
                                            valor={detalle.canal}
                                        />
                                        <DatoDetalle
                                            titulo="Cliente"
                                            valor={
                                                detalle.lector?.nombre ||
                                                "Cliente no asociado"
                                            }
                                        />
                                        <DatoDetalle
                                            titulo="Atendido por"
                                            valor={detalle.atendidoPor}
                                        />
                                        <DatoDetalle
                                            titulo="Pedido asociado"
                                            valor={detalle.numeroPedido || "Sin pedido"}
                                        />
                                        <DatoDetalle
                                            titulo="ID del pedido"
                                            valor={detalle.pedidoId}
                                        />
                                        <DatoDetalle
                                            titulo="Tipo de comprobante"
                                            valor={detalle.tipoComprobante}
                                        />
                                        <DatoDetalle
                                            titulo="Número de comprobante"
                                            valor={detalle.numeroComprobante}
                                        />
                                    </div>

                                    {/* IMPORTES */}
                                    <section className="rounded-2xl border border-stone-200 p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CircleDollarSign
                                                color={COLOR_PRINCIPAL}
                                                size={20}
                                            />
                                            <h3 className="font-bold text-slate-800">
                                                Resumen de importes
                                            </h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                        <span className="text-slate-500">
                          Subtotal
                        </span>
                                                <span>{formatoDinero(detalle.subtotal)}</span>
                                            </div>

                                            <div className="flex justify-between">
                        <span className="text-slate-500">
                          Impuesto
                        </span>
                                                <span>{formatoDinero(detalle.impuesto)}</span>
                                            </div>

                                            <div className="flex justify-between">
                        <span className="text-slate-500">
                          Descuento
                        </span>
                                                <span>{formatoDinero(detalle.descuento)}</span>
                                            </div>

                                            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold">
                                                <span>Total</span>
                                                <span className="text-[#3D7669]">
                          {formatoDinero(detalle.total)}
                        </span>
                                            </div>

                                            {detalle.vuelto != null && (
                                                <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Vuelto
                          </span>
                                                    <span className="font-semibold">
                            {formatoDinero(detalle.vuelto)}
                          </span>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* LIBROS VENDIDOS */}
                                    <section className="rounded-2xl border border-stone-200 bg-white p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <ShoppingBag size={20} className="text-[#3D7669]" />

                                            <h3 className="font-bold text-slate-800">
                                                Libros vendidos
                                            </h3>

                                            <span className="ml-auto rounded-full bg-[#F8F6F1] px-3 py-1 text-xs font-semibold text-slate-600">
                                          {detalle.lineas?.length ?? 0} ejemplares
                                        </span>
                                        </div>

                                        {!detalle.lineas?.length ? (
                                            <p className="rounded-xl bg-stone-50 p-4 text-sm text-slate-500">
                                                No se encontraron líneas para esta venta.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[600px] text-left text-sm">
                                                    <thead className="bg-[#F8F6F1] text-xs uppercase text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3">Libro</th>
                                                        <th className="px-4 py-3">Código de ejemplar</th>
                                                        <th className="px-4 py-3 text-right">Precio unitario</th>
                                                        <th className="px-4 py-3 text-right">Importe</th>
                                                    </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-stone-100">
                                                    {detalle.lineas.map((linea) => (
                                                        <tr key={linea.detalleVentaId}>
                                                            <td className="px-4 py-4">
                                                                <p className="font-semibold text-slate-800">
                                                                    {linea.libro?.nombre || "Libro sin nombre"}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Ejemplar ID: {linea.ejemplarId}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-4">
                                                    <span className="rounded-lg bg-stone-100 px-2 py-1 font-mono text-xs text-slate-700">
                                                      {linea.codigoEjemplar || "—"}
                                                    </span>
                                                            </td>

                                                            <td className="px-4 py-4 text-right text-slate-600">
                                                                {formatoDinero(linea.precioUnitario)}
                                                            </td>

                                                            <td className="px-4 py-4 text-right font-bold text-[#3D7669]">
                                                                {formatoDinero(linea.importe)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>

                                    {/* PAGOS DE LA VENTA */}
                                    <section className="rounded-2xl border border-stone-200 bg-white p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CreditCard size={20} className="text-[#3D7669]" />

                                            <h3 className="font-bold text-slate-800">
                                                Pagos de la venta
                                            </h3>

                                            <span className="ml-auto rounded-full bg-[#F8F6F1] px-3 py-1 text-xs font-semibold text-slate-600">
                                          {detalle.pagos?.length ?? 0} registros
                                        </span>
                                        </div>

                                        {!detalle.pagos?.length ? (
                                            <p className="rounded-xl bg-stone-50 p-4 text-sm text-slate-500">
                                                No se encontraron pagos para esta venta.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {detalle.pagos.map((pago) => (
                                                    <div
                                                        key={pago.pagoVentaId}
                                                        className="rounded-xl border border-stone-200 bg-[#F8F6F1] p-4"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {pago.metodo || pago.metodoCodigo}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Código: {pago.metodoCodigo || "—"}
                                                                </p>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-[#3D7669]">
                                                                    {formatoDinero(pago.monto)}
                                                                </p>

                                                                <EtiquetaEstado estado={pago.estado} />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-2">
                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Referencia del pago
                                                                </p>
                                                                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                                                                    {pago.referenciaPago || "Sin referencia"}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Fecha de confirmación
                                                                </p>
                                                                <p className="mt-1 text-sm font-medium text-slate-700">
                                                                    {pago.fechaConfirmacion
                                                                        ? formatoFecha(pago.fechaConfirmacion)
                                                                        : "No confirmado"}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Registrado por
                                                                </p>
                                                                <p className="mt-1 text-sm font-medium text-slate-700">
                                                                    {pago.registradoPor || "—"}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    ID del pago
                                                                </p>
                                                                <p className="mt-1 text-sm font-medium text-slate-700">
                                                                    {pago.pagoVentaId}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {detalle.observaciones && (
                                        <section>
                                            <h3 className="font-bold text-slate-800">
                                                Observaciones
                                            </h3>
                                            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#F8F6F1] p-4 text-sm text-slate-600">
                                                {detalle.observaciones}
                                            </p>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}