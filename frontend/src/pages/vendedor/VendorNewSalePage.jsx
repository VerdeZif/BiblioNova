
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    Search,
    Plus,
    Minus,
    ShoppingBag,
    Banknote,
    CreditCard,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";

import {
    buscarEjemplaresVenta,
    registrarVentaPresencial,
} from "../../services/ventaPresencial";

const TAMANO = 10;

function mensajeError(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
        return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "Tu cuenta no tiene permisos para esta operación.";
    }

    if (typeof data === "string") {
        return data;
    }

    return (
        data?.mensaje ||
        data?.message ||
        error?.message ||
        "No se pudo completar la operación."
    );
}

export default function VendorNewSalePage() {
    const [busqueda, setBusqueda] = useState("");
    const [consulta, setConsulta] = useState("");
    const [pagina, setPagina] = useState(0);

    const [ejemplares, setEjemplares] = useState([]);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [cargando, setCargando] = useState(true);

    const [seleccionados, setSeleccionados] = useState([]);

    const [metodoPago, setMetodoPago] = useState(
        "EFECTIVO_TIENDA"
    );
    const [montoRecibido, setMontoRecibido] = useState("");
    const [referenciaPago, setReferenciaPago] = useState("");
    const [observaciones, setObservaciones] = useState("");

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState(null);
    const [recargar, setRecargar] = useState(0);

    useEffect(() => {
        let cancelado = false;

        async function cargar() {
            setCargando(true);
            setError("");

            try {
                const datos = await buscarEjemplaresVenta({
                    q: consulta,
                    page: pagina,
                    size: TAMANO,
                });

                if (!cancelado) {
                    setEjemplares(datos.contenido);
                    setTotalPaginas(Number(datos.totalPaginas ?? 0));
                }
            } catch (err) {
                if (!cancelado) {
                    setEjemplares([]);
                    setTotalPaginas(0);
                    setError(mensajeError(err));
                }
            } finally {
                if (!cancelado) setCargando(false);
            }
        }

        cargar();

        return () => {
            cancelado = true;
        };
    }, [consulta, pagina, recargar]);

    const buscar = (evento) => {
        evento.preventDefault();
        setPagina(0);
        setConsulta(busqueda.trim());
    };

    const agregar = (ejemplar) => {
        const codigo = String(ejemplar.codigoEjemplar ?? "");

        if (!codigo) return;

        setSeleccionados((anteriores) => {
            if (
                anteriores.some(
                    (item) => item.codigoEjemplar === codigo
                )
            ) {
                return anteriores;
            }

            if (anteriores.length >= 30) {
                setError("La venta admite hasta 30 ejemplares.");
                return anteriores;
            }

            return [
                ...anteriores,
                {
                    codigoEjemplar: codigo,
                    titulo:
                        ejemplar.libro?.nombre ||
                        ejemplar.libro?.titulo ||
                        "Libro",
                },
            ];
        });

        setExito(null);
    };

    const quitar = (codigo) => {
        setSeleccionados((anteriores) =>
            anteriores.filter(
                (item) => item.codigoEjemplar !== codigo
            )
        );
    };

    const registrar = async (evento) => {
        evento.preventDefault();

        if (guardando || exito) return;

        setError("");

        if (seleccionados.length === 0) {
            setError("Selecciona al menos un ejemplar.");
            return;
        }

        const confirmado = window.confirm(
            `¿Confirmas registrar la venta de ${seleccionados.length} ejemplar(es)? Verifica que el pago haya sido recibido.`
        );

        if (!confirmado) return;

        try {
            setGuardando(true);

            const resultado = await registrarVentaPresencial({
                codigosEjemplar: seleccionados.map(
                    (item) => item.codigoEjemplar
                ),
                metodoPagoCodigo: metodoPago,
                montoRecibido,
                referenciaPago,
                observaciones,
            });

            setExito(resultado ?? {});
            setSeleccionados([]);
            setMontoRecibido("");
            setReferenciaPago("");
            setObservaciones("");
            setRecargar((actual) => actual + 1);
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const ventaCompletada = exito !== null;

    return (
        <main className="mx-auto max-w-6xl px-5 py-10">
            <Link
                to="/vendedor/ventas"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#3D7669]"
            >
                <ArrowLeft size={18} />
                Volver a ventas
            </Link>

            <div className="mt-6">
                <p className="text-sm font-semibold text-[#3D7669]">
                    Vendedor
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-800">
                    Registrar venta presencial
                </h1>

                <p className="mt-2 text-slate-500">
                    Selecciona ejemplares disponibles y registra
                    el pago recibido en mostrador.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle size={19} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {ventaCompletada && (
                <section
                    role="status"
                    className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6"
                >
                    <div className="flex items-center gap-3 text-emerald-700">
                        <CheckCircle2 size={26} />
                        <h2 className="text-lg font-bold">
                            Venta registrada correctamente
                        </h2>
                    </div>

                    {(exito.codigoVenta || exito.ventaId) && (
                        <p className="mt-3 text-slate-700">
                            Referencia:{" "}
                            <strong>
                                {exito.codigoVenta ||
                                    `Venta #${exito.ventaId}`}
                            </strong>
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setExito(null);
                            setError("");
                        }}
                        className="mt-5 rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-semibold text-white"
                    >
                        Registrar otra venta
                    </button>
                </section>
            )}

            {!ventaCompletada && (
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">

                    {/* BÚSQUEDA DE EJEMPLARES */}
                    <section className="min-w-0 rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">
                            Ejemplares disponibles
                        </h2>

                        <form
                            onSubmit={buscar}
                            className="mt-5 flex gap-2"
                        >
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por libro o código"
                                className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                            />

                            <button
                                type="submit"
                                className="rounded-xl bg-[#3D7669] px-4 text-white"
                                aria-label="Buscar ejemplares"
                            >
                                <Search size={19} />
                            </button>
                        </form>

                        <p className="mt-3 text-xs text-slate-500">
                            Se consultan ejemplares disponibles no
                            marcados para préstamo. El servidor validará
                            cuáles pueden venderse.
                        </p>

                        {cargando && (
                            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                                <RefreshCw
                                    size={17}
                                    className="animate-spin"
                                />
                                Cargando ejemplares...
                            </p>
                        )}

                        {!cargando && ejemplares.length === 0 && (
                            <p className="mt-6 rounded-xl bg-stone-50 p-5 text-sm text-slate-500">
                                No se encontraron ejemplares con
                                los filtros seleccionados.
                            </p>
                        )}

                        {!cargando && (
                            <div className="mt-5 space-y-3">
                                {ejemplares.map((ejemplar) => {
                                    const codigo = String(
                                        ejemplar.codigoEjemplar ?? ""
                                    );

                                    const estaSeleccionado =
                                        seleccionados.some(
                                            (item) => item.codigoEjemplar === codigo
                                        );

                                    return (
                                        <article
                                            key={ejemplar.ejemplarId ?? codigo}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-800">
                                                    {ejemplar.libro?.nombre ||
                                                        ejemplar.libro?.titulo ||
                                                        "Libro sin título"}
                                                </p>

                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                    {codigo || "Sin código"}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    !codigo ||
                                                    estaSeleccionado ||
                                                    guardando ||
                                                    seleccionados.length >= 30
                                                }
                                                onClick={() => agregar(ejemplar)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-[#3D7669] px-3 py-2 text-xs font-semibold text-white disabled:bg-stone-300"
                                            >
                                                <Plus size={16} />
                                                {estaSeleccionado
                                                    ? "Agregado"
                                                    : "Agregar"}
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={pagina === 0 || cargando}
                                onClick={() => setPagina((p) => p - 1)}
                                className="rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:opacity-40"
                            >
                                Anterior
                            </button>

                            <span className="text-xs text-slate-500">
                Página {pagina + 1} de{" "}
                                {Math.max(1, totalPaginas)}
              </span>

                            <button
                                type="button"
                                disabled={
                                    cargando || pagina + 1 >= totalPaginas
                                }
                                onClick={() => setPagina((p) => p + 1)}
                                className="rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    </section>

                    {/* FORMULARIO DE VENTA */}
                    <section className="min-w-0 rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <ShoppingBag
                                size={23}
                                className="text-[#3D7669]"
                            />
                            Venta actual
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            {seleccionados.length} de 30 ejemplares
                            seleccionados
                        </p>

                        <div className="mt-5 space-y-3">
                            {seleccionados.length === 0 && (
                                <p className="rounded-xl bg-stone-50 p-4 text-sm text-slate-500">
                                    Agrega los ejemplares desde la búsqueda.
                                </p>
                            )}

                            {seleccionados.map((item) => (
                                <div
                                    key={item.codigoEjemplar}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F6F1] p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800">
                                            {item.titulo}
                                        </p>

                                        <p className="mt-1 break-all text-xs text-slate-500">
                                            {item.codigoEjemplar}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={guardando}
                                        onClick={() =>
                                            quitar(item.codigoEjemplar)
                                        }
                                        aria-label={`Quitar ${item.codigoEjemplar}`}
                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                                    >
                                        <Minus size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <form
                            onSubmit={registrar}
                            className="mt-6 space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="metodo-pago"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Método de pago
                                </label>

                                <select
                                    id="metodo-pago"
                                    value={metodoPago}
                                    disabled={guardando}
                                    onChange={(e) =>
                                        setMetodoPago(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
                                >
                                    <option value="EFECTIVO_TIENDA">
                                        Efectivo en tienda
                                    </option>

                                    <option value="TARJETA_TIENDA">
                                        Tarjeta en tienda
                                    </option>
                                </select>
                            </div>

                            {metodoPago === "EFECTIVO_TIENDA" ? (
                                <div>
                                    <label
                                        htmlFor="monto-recibido"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Monto recibido (S/)
                                    </label>

                                    <input
                                        id="monto-recibido"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        disabled={guardando}
                                        value={montoRecibido}
                                        onChange={(e) =>
                                            setMontoRecibido(e.target.value)
                                        }
                                        placeholder="Ejemplo: 50.00"
                                        className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        Confirma el total de la compra con
                                        los precios vigentes antes de cobrar.
                                        El servidor comprobará el monto.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label
                                        htmlFor="referencia-pago"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Referencia de operación
                                    </label>

                                    <input
                                        id="referencia-pago"
                                        value={referenciaPago}
                                        maxLength={100}
                                        disabled={guardando}
                                        onChange={(e) =>
                                            setReferenciaPago(e.target.value)
                                        }
                                        placeholder="Número de operación del voucher"
                                        className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
                                    />
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="observaciones"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Observaciones
                                </label>

                                <textarea
                                    id="observaciones"
                                    value={observaciones}
                                    maxLength={500}
                                    disabled={guardando}
                                    rows={3}
                                    onChange={(e) =>
                                        setObservaciones(e.target.value)
                                    }
                                    placeholder="Opcional"
                                    className="mt-2 w-full resize-y rounded-xl border border-stone-200 px-4 py-3"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    guardando ||
                                    seleccionados.length === 0
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-5 py-4 font-semibold text-white disabled:bg-stone-300"
                            >
                                {guardando ? (
                                    <RefreshCw
                                        size={19}
                                        className="animate-spin"
                                    />
                                ) : metodoPago === "EFECTIVO_TIENDA" ? (
                                    <Banknote size={19} />
                                ) : (
                                    <CreditCard size={19} />
                                )}

                                {guardando
                                    ? "Registrando..."
                                    : "Registrar venta"}
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
