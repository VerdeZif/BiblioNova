import { useCallback, useEffect, useState } from "react";

import {
    ClipboardList,
    RefreshCw,
    AlertCircle,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Save,
    CheckCircle2,
    CreditCard,
    Ban,
    XCircle,
} from "lucide-react";

import {
    listarPedidosVendedor,
    obtenerPedidoVendedor,
    cambiarEstadoPedidoVendedor,
    confirmarPedidoVendedor,
    confirmarPagoPedidoVendedor,
    cancelarPedidoVendedor,
} from "../../services/ventasVendedor";

const TAMANO_PAGINA = 10;

const ESTADOS = [
    "Confirmado",
    "Preparando",
    "ListoRecojo",
    "Despachado",
    "Entregado",
];

const FORMULARIO_VACIO = {
    estado: "",
    operador: "",
    codigoSeguimiento: "",
    recibidoPor: "",
    observaciones: "",
};

function mensajeError(error) {
    const status = error?.response?.status;
    const datos = error?.response?.data;

    if (status === 401) {
        return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "No tienes permisos para realizar esta operación.";
    }

    if (status === 404) {
        return "El pedido solicitado no existe.";
    }

    if (status === 409) {
        return (
            datos?.mensaje ||
            datos?.message ||
            "El cambio no está permitido para el estado actual del pedido."
        );
    }

    if (typeof datos === "string" && datos.trim()) {
        return datos;
    }

    return (
        datos?.mensaje ||
        datos?.message ||
        error?.message ||
        "No se pudo completar la operación."
    );
}

function formatearFecha(fecha) {
    if (!fecha) return "No disponible";

    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    const valor = new Date(
        soloFecha ? `${fecha}T00:00:00` : fecha
    );

    if (Number.isNaN(valor.getTime())) {
        return String(fecha);
    }

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        ...(!soloFecha ? { timeStyle: "short" } : {}),
    }).format(valor);
}

function formatearMonto(valor) {
    if (valor == null || !Number.isFinite(Number(valor))) {
        return "No disponible";
    }

    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
    }).format(Number(valor));
}

function colorEstado(estado) {
    switch (estado) {
        case "Pendiente":
            return "bg-amber-50 text-amber-700";

        case "Confirmado":
        case "Preparando":
            return "bg-blue-50 text-blue-700";

        case "ListoRecojo":
        case "Despachado":
            return "bg-violet-50 text-violet-700";

        case "Entregado":
            return "bg-emerald-50 text-emerald-700";

        case "Cancelado":
            return "bg-red-50 text-red-700";

        default:
            return "bg-stone-100 text-slate-700";
    }
}

function CampoDetalle({ titulo, valor }) {
    return (
        <div className="rounded-xl bg-[#F8F6F1] p-4">
            <p className="text-xs text-slate-500">{titulo}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {valor == null || valor === ""
                    ? "No disponible"
                    : valor}
            </p>
        </div>
    );
}

export default function VendorOrdersPage() {
    const [pedidos, setPedidos] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [detalle, setDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(null);
    const [errorDetalle, setErrorDetalle] = useState("");

    const [formulario, setFormulario] = useState(
        { ...FORMULARIO_VACIO }
    );
    const [guardando, setGuardando] = useState(false);

    // Estados para confirmación de pago
    const [confirmandoPago, setConfirmandoPago] = useState(false);
    const [referenciaPago, setReferenciaPago] = useState("");

    // Estados para cancelación de pedidos
    const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState("");
    const [cancelando, setCancelando] = useState(false);

    const cargarPedidos = useCallback(async () => {
        setCargando(true);
        setError("");

        try {
            const datos = await listarPedidosVendedor({
                page: pagina,
                size: TAMANO_PAGINA,
            });

            if (!Array.isArray(datos?.contenido)) {
                throw new Error(
                    "El servidor no devolvió la lista paginada esperada."
                );
            }

            setPedidos(datos.contenido);
            setTotalPaginas(Number(datos.totalPaginas ?? 0));
            setTotalElementos(Number(datos.totalElementos ?? 0));
        } catch (err) {
            setPedidos([]);
            setTotalPaginas(0);
            setTotalElementos(0);
            setError(mensajeError(err));
        } finally {
            setCargando(false);
        }
    }, [pagina]);

    useEffect(() => {
        cargarPedidos();
    }, [cargarPedidos]);

    const verDetalle = async (pedidoId) => {
        if (cargandoDetalle !== null || guardando || cancelando) return;

        setErrorDetalle("");
        setMensaje("");
        setMostrarCancelacion(false);
        setMotivoCancelacion("");

        try {
            setCargandoDetalle(pedidoId);

            const resultado = await obtenerPedidoVendedor(pedidoId);

            setDetalle(resultado);
            setFormulario({
                ...FORMULARIO_VACIO,
                estado: resultado.estado ?? "",
            });
        } catch (err) {
            setErrorDetalle(mensajeError(err));
        } finally {
            setCargandoDetalle(null);
        }
    };

    const actualizarCampo = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
        setErrorDetalle("");
    };

    const confirmarPago = async (pago) => {
        if (!detalle || confirmandoPago || guardando || cancelando) return;

        const idPedido = detalle.pedidoId ?? detalle.id;
        const idPago = pago.pagoPedidoId;

        if (!idPedido || !idPago) {
            setErrorDetalle(
                "No se encontró el identificador del pedido o del pago."
            );
            return;
        }

        if (pago.metodoCodigo === "PAGO_ONLINE") {
            setErrorDetalle(
                "El pago online debe confirmarse mediante su pasarela."
            );
            return;
        }

        const confirmado = window.confirm(
            `Confirma únicamente si ya recibiste el pago de S/ ${Number(
                pago.monto
            ).toFixed(2)} mediante ${pago.metodoNombre || pago.metodoCodigo}. ¿Registrar el pago como recibido?`
        );

        if (!confirmado) return;

        try {
            setConfirmandoPago(true);
            setErrorDetalle("");

            await confirmarPagoPedidoVendedor(
                idPedido,
                idPago,
                referenciaPago
            );

            const actualizado = await obtenerPedidoVendedor(idPedido);

            setDetalle(actualizado);
            setFormulario({
                ...FORMULARIO_VACIO,
                estado: actualizado.estado,
            });
            setReferenciaPago("");

            setMensaje("El pago se confirmó correctamente.");

            await cargarPedidos();
        } catch (err) {
            setErrorDetalle(mensajeError(err));
        } finally {
            setConfirmandoPago(false);
        }
    };

    const guardarEstado = async (evento) => {
        evento.preventDefault();

        if (!detalle || guardando || cancelando) return;

        const id = detalle.pedidoId ?? detalle.id;

        if (!id) {
            setErrorDetalle(
                "No se encontró el identificador del pedido."
            );
            return;
        }

        if (formulario.estado === detalle.estado) {
            setErrorDetalle(
                "Selecciona un estado diferente al actual."
            );
            return;
        }

        if (
            !window.confirm(
                `¿Confirmas cambiar el pedido al estado "${formulario.estado}"?`
            )
        ) {
            return;
        }

        try {
            setGuardando(true);
            setErrorDetalle("");

            if (formulario.estado === "Confirmado") {
                await confirmarPedidoVendedor(id);
            } else {
                await cambiarEstadoPedidoVendedor(id, formulario);
            }

            const actualizado = await obtenerPedidoVendedor(id);

            setDetalle(actualizado);
            setFormulario({
                ...FORMULARIO_VACIO,
                estado: actualizado.estado ?? "",
            });

            setMensaje(
                "El estado del pedido se actualizó correctamente."
            );

            await cargarPedidos();
        } catch (err) {
            setErrorDetalle(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const cancelarPedido = async (evento) => {
        evento.preventDefault();

        if (!detalle || cancelando || guardando || confirmandoPago) return;

        const pedidoId = detalle.pedidoId ?? detalle.id;

        const estadosCancelables = [
            "Pendiente",
            "Confirmado",
            "Preparando",
            "ListoRecojo",
        ];

        if (!estadosCancelables.includes(detalle.estado)) {
            setErrorDetalle(
                "El estado actual no permite cancelar el pedido."
            );
            return;
        }

        if (["Pagado", "Parcial"].includes(detalle.estadoPago)) {
            setErrorDetalle(
                "No se puede cancelar un pedido con pagos confirmados."
            );
            return;
        }

        if (!motivoCancelacion.trim()) {
            setErrorDetalle(
                "Ingresa el motivo de cancelación."
            );
            return;
        }

        const confirmado = window.confirm(
            "¿Confirmas la cancelación? El sistema liberará los ejemplares apartados para este pedido."
        );

        if (!confirmado) return;

        try {
            setCancelando(true);
            setErrorDetalle("");

            await cancelarPedidoVendedor(
                pedidoId,
                motivoCancelacion
            );

            setDetalle(null);
            setMostrarCancelacion(false);
            setMotivoCancelacion("");

            setMensaje("El pedido fue cancelado correctamente.");

            await cargarPedidos();
        } catch (err) {
            setErrorDetalle(mensajeError(err));
        } finally {
            setCancelando(false);
        }
    };

    const cerrarDetalle = () => {
        if (guardando || cancelando || confirmandoPago) return;

        setDetalle(null);
        setFormulario({ ...FORMULARIO_VACIO });
        setMostrarCancelacion(false);
        setMotivoCancelacion("");
        setErrorDetalle("");
    };

    const estadoFinal =
        detalle?.estado === "Entregado" ||
        detalle?.estado === "Cancelado";

    return (
        <main className="mx-auto max-w-6xl px-5 py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#3D7669]">
                        Vendedor
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-800">
                        Gestión de pedidos
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Consulta y actualiza el seguimiento de pedidos.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={cargarPedidos}
                    disabled={cargando}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                    <RefreshCw
                        size={18}
                        className={cargando ? "animate-spin" : ""}
                    />
                    Actualizar
                </button>
            </div>

            {mensaje && (
                <div
                    role="status"
                    className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    <CheckCircle2 size={19} />
                    {mensaje}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle size={19} />
                    {error}
                </div>
            )}

            {errorDetalle && !detalle && (
                <div
                    role="alert"
                    className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    {errorDetalle}
                </div>
            )}

            <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <ClipboardList
                        size={24}
                        className="text-[#3D7669]"
                    />
                    <p className="font-semibold text-slate-700">
                        Total de pedidos encontrados
                    </p>
                </div>

                <p className="mt-3 text-3xl font-bold text-[#3D7669]">
                    {totalElementos}
                </p>
            </section>

            {cargando && (
                <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500">
                    Cargando pedidos...
                </p>
            )}

            {!cargando && !error && pedidos.length === 0 && (
                <div className="mt-6 rounded-2xl bg-white p-10 text-center">
                    <ShoppingBag
                        size={42}
                        className="mx-auto text-stone-300"
                    />
                    <h2 className="mt-4 font-bold text-slate-800">
                        No se encontraron pedidos
                    </h2>
                </div>
            )}

            {!cargando && pedidos.length > 0 && (
                <div className="mt-6 space-y-4">
                    {pedidos.map((pedido) => {
                        const id = pedido.pedidoId ?? pedido.id;

                        return (
                            <article
                                key={id}
                                className="rounded-2xl bg-white p-6 shadow-sm"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-slate-800">
                                            {pedido.codigoPedido || `Pedido #${id}`}
                                        </h2>

                                        <div className="mt-3 flex flex-wrap gap-2">
                      <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(pedido.estado)}`}
                      >
                        {pedido.estado || "Sin estado"}
                      </span>

                                            {pedido.tipoEntrega && (
                                                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-slate-600">
                          {pedido.tipoEntrega}
                        </span>
                                            )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
                                            {(pedido.fechaPedido ||
                                                pedido.fechaCreacion) && (
                                                <span>
                          Fecha:{" "}
                                                    {formatearFecha(
                                                        pedido.fechaPedido ??
                                                        pedido.fechaCreacion
                                                    )}
                        </span>
                                            )}

                                            {pedido.total != null && (
                                                <span className="font-semibold text-[#3D7669]">
                          {formatearMonto(pedido.total)}
                        </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!id || cargandoDetalle !== null}
                                        onClick={() => verDetalle(id)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                        {cargandoDetalle === id ? (
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                        Ver / gestionar
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <button
                    type="button"
                    disabled={cargando || pagina === 0}
                    onClick={() =>
                        setPagina((actual) => Math.max(0, actual - 1))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                    <ChevronLeft size={17} />
                    Anterior
                </button>

                <span className="text-center text-sm text-slate-500">
          Página {pagina + 1} de {Math.max(1, totalPaginas)}
        </span>

                <button
                    type="button"
                    disabled={cargando || pagina + 1 >= totalPaginas}
                    onClick={() => setPagina((actual) => actual + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                    Siguiente
                    <ChevronRight size={17} />
                </button>
            </div>

            {/* DETALLE Y CAMBIO DE ESTADO */}
            {detalle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Gestionar pedido"
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {detalle.codigoPedido ||
                                        `Pedido #${detalle.pedidoId ?? detalle.id}`}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Información y seguimiento
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarDetalle}
                                disabled={guardando || cancelando || confirmandoPago}
                                aria-label="Cerrar"
                                className="rounded-lg p-2 hover:bg-stone-100 disabled:opacity-40"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <CampoDetalle
                                titulo="Estado actual"
                                valor={detalle.estado}
                            />
                            <CampoDetalle
                                titulo="Tipo de entrega"
                                valor={detalle.tipoEntrega}
                            />
                            <CampoDetalle
                                titulo="Fecha"
                                valor={formatearFecha(
                                    detalle.fechaPedido ?? detalle.fechaCreacion
                                )}
                            />
                            <CampoDetalle
                                titulo="Total"
                                valor={formatearMonto(detalle.total)}
                            />
                        </div>

                        {/* PAGOS DEL PEDIDO */}
                        <section className="mt-6 rounded-2xl border border-stone-200 p-5">
                            <div className="flex items-center gap-2">
                                <CreditCard size={21} className="text-[#3D7669]" />
                                <h3 className="text-lg font-bold text-slate-800">
                                    Pagos del pedido
                                </h3>
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                                Estado del pago:{" "}
                                <strong>{detalle.estadoPago || "No disponible"}</strong>
                            </p>

                            {errorDetalle && (
                                <p
                                    role="alert"
                                    className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {errorDetalle}
                                </p>
                            )}

                            {detalle.estadoPago === "Pagado" && (
                                <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                    Pago completo confirmado. Puedes continuar con
                                    la entrega si se cumplen las demás condiciones.
                                </p>
                            )}

                            {Array.isArray(detalle.pagos) &&
                                detalle.pagos.map((pago) => (
                                    <div
                                        key={pago.pagoPedidoId}
                                        className="mt-4 rounded-xl bg-[#F8F6F1] p-4"
                                    >
                                        <p className="font-semibold text-slate-800">
                                            {pago.metodoNombre || pago.metodoCodigo}
                                        </p>

                                        <p className="mt-2 text-sm text-slate-600">
                                            Monto: S/ {Number(pago.monto).toFixed(2)}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            Estado: {pago.estado}
                                        </p>

                                        {pago.estado === "Pendiente" &&
                                            pago.metodoCodigo !== "PAGO_ONLINE" && (
                                                <div className="mt-4 space-y-3">
                                                    <input
                                                        type="text"
                                                        value={referenciaPago}
                                                        onChange={(e) =>
                                                            setReferenciaPago(e.target.value)
                                                        }
                                                        placeholder="Referencia del pago (opcional)"
                                                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
                                                    />

                                                    <button
                                                        type="button"
                                                        disabled={confirmandoPago || guardando || cancelando}
                                                        onClick={() => confirmarPago(pago)}
                                                        className="rounded-xl bg-[#3D7669] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {confirmandoPago
                                                            ? "Confirmando..."
                                                            : "Confirmar pago recibido"}
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                ))}
                        </section>

                        <div className="mt-7 border-t border-stone-200 pt-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                Actualizar estado
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Selecciona un nuevo estado. El servidor
                                comprobará que la transición esté permitida.
                            </p>

                            {errorDetalle && (
                                <p
                                    role="alert"
                                    className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {errorDetalle}
                                </p>
                            )}

                            {estadoFinal ? (
                                <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-slate-600">
                                    Este pedido está en estado{" "}
                                    <strong>{detalle.estado}</strong>.
                                    No se ofrecen cambios desde esta pantalla.
                                </div>
                            ) : (
                                <form
                                    onSubmit={guardarEstado}
                                    className="mt-5 space-y-4"
                                >
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Nuevo estado *
                                        <select
                                            required
                                            value={formulario.estado}
                                            disabled={guardando || cancelando}
                                            onChange={(e) =>
                                                actualizarCampo("estado", e.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3"
                                        >
                                            {ESTADOS.map((estado) => (
                                                <option
                                                    key={estado}
                                                    value={estado}
                                                >
                                                    {estado}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Operador
                                        <input
                                            value={formulario.operador}
                                            maxLength={100}
                                            disabled={guardando || cancelando}
                                            onChange={(e) =>
                                                actualizarCampo(
                                                    "operador",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Empresa o responsable del transporte"
                                            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal"
                                        />
                                    </label>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Código de seguimiento
                                        <input
                                            value={formulario.codigoSeguimiento}
                                            maxLength={100}
                                            disabled={guardando || cancelando}
                                            onChange={(e) =>
                                                actualizarCampo(
                                                    "codigoSeguimiento",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Opcional"
                                            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal"
                                        />
                                    </label>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Recibido por
                                        <input
                                            value={formulario.recibidoPor}
                                            maxLength={150}
                                            disabled={guardando || cancelando}
                                            onChange={(e) =>
                                                actualizarCampo(
                                                    "recibidoPor",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nombre de quien recibió el pedido"
                                            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal"
                                        />
                                    </label>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Observaciones
                                        <textarea
                                            value={formulario.observaciones}
                                            maxLength={500}
                                            rows={3}
                                            disabled={guardando || cancelando}
                                            onChange={(e) =>
                                                actualizarCampo(
                                                    "observaciones",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Observaciones del cambio de estado"
                                            className="mt-2 w-full resize-y rounded-xl border border-stone-200 px-4 py-3 font-normal"
                                        />
                                    </label>

                                    {formulario.estado === "Entregado" &&
                                        detalle.estadoPago !== "Pagado" && (
                                            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                                Primero confirma el pago recibido en la sección
                                                «Pagos del pedido».
                                            </p>
                                        )}

                                    <button
                                        type="submit"
                                        disabled={
                                            guardando ||
                                            cancelando ||
                                            !formulario.estado ||
                                            formulario.estado === detalle.estado ||
                                            (formulario.estado === "Entregado" &&
                                                detalle.estadoPago !== "Pagado")
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white disabled:bg-stone-300"
                                    >
                                        {guardando ? (
                                            <RefreshCw
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {guardando
                                            ? "Guardando..."
                                            : "Guardar nuevo estado"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* CANCELACIÓN DEL PEDIDO */}
                        {["Pendiente", "Confirmado", "Preparando", "ListoRecojo"]
                                .includes(detalle.estado) &&
                            !["Pagado", "Parcial"].includes(detalle.estadoPago) && (
                                <section className="mt-7 border-t border-stone-200 pt-6">
                                    <div className="flex items-center gap-2">
                                        <Ban size={21} className="text-red-600" />

                                        <h3 className="text-lg font-bold text-slate-800">
                                            Cancelar pedido
                                        </h3>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        La cancelación liberará los ejemplares reservados
                                        para este pedido. Esta operación debe realizarse
                                        únicamente cuando corresponda.
                                    </p>

                                    {!mostrarCancelacion ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMostrarCancelacion(true);
                                                setErrorDetalle("");
                                            }}
                                            disabled={guardando || cancelando || confirmandoPago}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                                        >
                                            <XCircle size={18} />
                                            Solicitar cancelación
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={cancelarPedido}
                                            className="mt-5 space-y-4 rounded-xl border border-red-100 bg-red-50/50 p-5"
                                        >
                                            <label className="block text-sm font-semibold text-slate-700">
                                                Motivo de cancelación *

                                                <textarea
                                                    required
                                                    rows={3}
                                                    value={motivoCancelacion}
                                                    onChange={(e) =>
                                                        setMotivoCancelacion(e.target.value)
                                                    }
                                                    placeholder="Describe por qué se cancelará el pedido"
                                                    disabled={cancelando}
                                                    className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-white p-3 font-normal outline-none focus:border-red-400"
                                                />
                                            </label>

                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={cancelando || !motivoCancelacion.trim()}
                                                    className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                                >
                                                    {cancelando
                                                        ? "Cancelando..."
                                                        : "Confirmar cancelación"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={cancelando}
                                                    onClick={() => {
                                                        setMostrarCancelacion(false);
                                                        setMotivoCancelacion("");
                                                        setErrorDetalle("");
                                                    }}
                                                    className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                                                >
                                                    Volver
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </section>
                            )}

                        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
                            <button
                                type="button"
                                onClick={cerrarDetalle}
                                disabled={guardando || cancelando || confirmandoPago}
                                className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}