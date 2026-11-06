
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    BookOpen,
    CalendarDays,
    Bookmark,
    Clock3,
    RefreshCw,
    XCircle,
    AlertCircle,
    CheckCircle2,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";

import {
    listarMisReservas,
    cancelarReserva,
} from "../../services/reservas";

import {
    listarMisPrestamos,
    obtenerMiPrestamo,
} from "../../services/misPrestamos";

const TAMANO_PAGINA = 10;

function obtenerMensajeError(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
        return "Tu sesión ha sido rechazada. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "No tienes permisos para consultar esta información.";
    }

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    return (
        data?.mensaje ||
        data?.message ||
        error?.message ||
        "Ocurrió un error inesperado."
    );
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin registro";

    const esFecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    const valor = new Date(
        esFecha ? `${fecha}T00:00:00` : fecha
    );

    if (Number.isNaN(valor.getTime())) {
        return String(fecha);
    }

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        ...(!esFecha ? { timeStyle: "short" } : {}),
    }).format(valor);
}

function claseEstado(estado) {
    if (estado === "Pendiente") {
        return "bg-amber-50 text-amber-700";
    }

    if (estado === "Activo") {
        return "bg-blue-50 text-blue-700";
    }

    if (
        estado === "Devuelto" ||
        estado === "Atendida"
    ) {
        return "bg-emerald-50 text-emerald-700";
    }

    if (
        estado === "Cancelada" ||
        estado === "Cancelado" ||
        estado === "Anulado"
    ) {
        return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
}

export default function MyLoansPage() {
    const [pestana, setPestana] = useState("prestamos");

    // Préstamos del cliente.
    const [prestamos, setPrestamos] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalPrestamos, setTotalPrestamos] = useState(0);
    const [cargandoPrestamos, setCargandoPrestamos] =
        useState(true);

    const [detalle, setDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] =
        useState(null);

    // Reservas del cliente.
    const [reservas, setReservas] = useState([]);
    const [cargandoReservas, setCargandoReservas] =
        useState(true);
    const [cancelandoId, setCancelandoId] = useState(null);

    // Mensajes independientes para no ocultar
    // errores de una sección en otra.
    const [errorPrestamos, setErrorPrestamos] = useState("");
    const [errorReservas, setErrorReservas] = useState("");
    const [mensajeReservas, setMensajeReservas] = useState("");

    const cargarPrestamos = useCallback(async () => {
        try {
            setCargandoPrestamos(true);
            setErrorPrestamos("");

            const resultado = await listarMisPrestamos({
                page: pagina,
                size: TAMANO_PAGINA,
            });

            setPrestamos(resultado.contenido);
            setTotalPaginas(Number(resultado.totalPaginas ?? 0));
            setTotalPrestamos(Number(resultado.totalElementos ?? 0));
        } catch (error) {
            setPrestamos([]);
            setTotalPaginas(0);
            setTotalPrestamos(0);
            setErrorPrestamos(obtenerMensajeError(error));
        } finally {
            setCargandoPrestamos(false);
        }
    }, [pagina]);

    const cargarReservas = useCallback(async () => {
        try {
            setCargandoReservas(true);
            setErrorReservas("");

            const resultado = await listarMisReservas();
            setReservas(resultado);
        } catch (error) {
            setReservas([]);
            setErrorReservas(obtenerMensajeError(error));
        } finally {
            setCargandoReservas(false);
        }
    }, []);

    useEffect(() => {
        cargarPrestamos();
    }, [cargarPrestamos]);

    useEffect(() => {
        cargarReservas();
    }, [cargarReservas]);

    const abrirDetalle = async (prestamoId) => {
        try {
            setCargandoDetalle(prestamoId);
            setErrorPrestamos("");

            const resultado = await obtenerMiPrestamo(prestamoId);

            setDetalle(resultado);
        } catch (error) {
            setErrorPrestamos(obtenerMensajeError(error));
        } finally {
            setCargandoDetalle(null);
        }
    };

    const confirmarCancelacion = async (reserva) => {
        if (cancelandoId !== null) return;

        const confirmado = window.confirm(
            `¿Deseas cancelar la reserva de "${reserva.libro?.nombre || "este libro"}"?`
        );

        if (!confirmado) return;

        try {
            setCancelandoId(reserva.reservaId);
            setErrorReservas("");
            setMensajeReservas("");

            await cancelarReserva(reserva.reservaId);

            setMensajeReservas(
                "La reserva se canceló correctamente."
            );

            await cargarReservas();
        } catch (error) {
            setErrorReservas(obtenerMensajeError(error));
        } finally {
            setCancelandoId(null);
        }
    };

    const reservasPendientes = reservas.filter(
        (reserva) => reserva.estado === "Pendiente"
    ).length;

    return (
        <div className="min-h-screen bg-[#F8F6F1]">
            <Navbar />

            <main className="mx-auto max-w-5xl px-5 py-10">
                <div>
                    <p className="text-sm font-semibold text-[#3D7669]">
                        Mi biblioteca
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-800">
                        Mis préstamos y reservas
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Consulta tus libros prestados y administra tus reservas.
                    </p>
                </div>

                {/* PESTAÑAS */}
                <div className="mt-8 flex flex-wrap gap-3 border-b border-stone-200 pb-4">
                    <button
                        type="button"
                        onClick={() => setPestana("prestamos")}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                            pestana === "prestamos"
                                ? "bg-[#3D7669] text-white"
                                : "bg-white text-slate-600"
                        }`}
                    >
                        <BookOpen size={18} />
                        Mis préstamos
                    </button>

                    <button
                        type="button"
                        onClick={() => setPestana("reservas")}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                            pestana === "reservas"
                                ? "bg-[#3D7669] text-white"
                                : "bg-white text-slate-600"
                        }`}
                    >
                        <Bookmark size={18} />
                        Mis reservas

                        {reservasPendientes > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {reservasPendientes}
              </span>
                        )}
                    </button>
                </div>

                {/* MIS PRÉSTAMOS */}
                {pestana === "prestamos" && (
                    <section className="mt-8">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Mis préstamos registrados
                                </p>
                                <p className="mt-2 text-3xl font-bold text-[#3D7669]">
                                    {totalPrestamos}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cargarPrestamos}
                                disabled={cargandoPrestamos}
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={18}
                                    className={
                                        cargandoPrestamos ? "animate-spin" : ""
                                    }
                                />
                                Actualizar
                            </button>
                        </div>

                        {errorPrestamos && (
                            <p
                                role="alert"
                                className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                            >
                                {errorPrestamos}
                            </p>
                        )}

                        {cargandoPrestamos && (
                            <p className="mt-5 rounded-2xl bg-white p-8 text-center text-slate-500">
                                Cargando tus préstamos...
                            </p>
                        )}

                        {!cargandoPrestamos &&
                            !errorPrestamos &&
                            prestamos.length === 0 && (
                                <div className="mt-5 rounded-2xl bg-white p-10 text-center shadow-sm">
                                    <BookOpen
                                        size={44}
                                        className="mx-auto text-stone-300"
                                    />

                                    <h2 className="mt-4 text-xl font-bold text-slate-800">
                                        Todavía no tienes préstamos
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Los préstamos que te registre la biblioteca
                                        aparecerán aquí.
                                    </p>

                                    <Link
                                        to="/catalogo"
                                        className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                                    >
                                        Explorar libros
                                    </Link>
                                </div>
                            )}

                        {!cargandoPrestamos &&
                            prestamos.length > 0 && (
                                <div className="mt-5 space-y-4">
                                    {prestamos.map((prestamo) => (
                                        <article
                                            key={prestamo.prestamoId}
                                            className="rounded-2xl bg-white p-6 shadow-sm"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-lg font-bold text-slate-800">
                                                        {prestamo.codigoPrestamo ||
                                                            `Préstamo #${prestamo.prestamoId}`}
                                                    </h2>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(prestamo.estado)}`}
                            >
                              {prestamo.estado}
                            </span>

                                                        {prestamo.vencido && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                <AlertCircle size={14} />
                                Vencido
                              </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays size={16} />
                              Prestado:{" "}
                                {formatearFecha(
                                    prestamo.fechaPrestamo
                                )}
                            </span>

                                                        <span className="inline-flex items-center gap-2">
                              <Clock3 size={16} />
                              Vence:{" "}
                                                            {formatearFecha(
                                                                prestamo.fechaVencimiento
                                                            )}
                            </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        cargandoDetalle === prestamo.prestamoId
                                                    }
                                                    onClick={() =>
                                                        abrirDetalle(prestamo.prestamoId)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                                >
                                                    {cargandoDetalle ===
                                                    prestamo.prestamoId ? (
                                                        <RefreshCw
                                                            size={17}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Eye size={17} />
                                                    )}

                                                    Ver libros
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                        {/* PAGINACIÓN */}
                        <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                            <button
                                type="button"
                                disabled={pagina === 0 || cargandoPrestamos}
                                onClick={() =>
                                    setPagina((actual) => Math.max(0, actual - 1))
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                            >
                                <ChevronLeft size={17} />
                                Anterior
                            </button>

                            <span className="text-sm text-slate-500">
                Página {pagina + 1} de{" "}
                                {Math.max(1, totalPaginas)}
              </span>

                            <button
                                type="button"
                                disabled={
                                    cargandoPrestamos ||
                                    pagina + 1 >= totalPaginas
                                }
                                onClick={() =>
                                    setPagina((actual) => actual + 1)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                            >
                                Siguiente
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </section>
                )}

                {/* MIS RESERVAS */}
                {pestana === "reservas" && (
                    <section className="mt-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Total de reservas
                                </p>

                                <p className="mt-2 text-3xl font-bold text-[#3D7669]">
                                    {reservas.length}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Reservas pendientes
                                </p>

                                <p className="mt-2 text-3xl font-bold text-[#3D7669]">
                                    {reservasPendientes}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={cargarReservas}
                                disabled={cargandoReservas}
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={18}
                                    className={
                                        cargandoReservas ? "animate-spin" : ""
                                    }
                                />
                                Actualizar
                            </button>
                        </div>

                        {errorReservas && (
                            <p
                                role="alert"
                                className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                            >
                                {errorReservas}
                            </p>
                        )}

                        {mensajeReservas && (
                            <p
                                role="status"
                                className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                            >
                                <CheckCircle2 size={17} className="mr-2 inline" />
                                {mensajeReservas}
                            </p>
                        )}

                        {cargandoReservas && (
                            <p className="mt-5 rounded-2xl bg-white p-8 text-center text-slate-500">
                                Cargando tus reservas...
                            </p>
                        )}

                        {!cargandoReservas &&
                            !errorReservas &&
                            reservas.length === 0 && (
                                <div className="mt-5 rounded-2xl bg-white p-10 text-center shadow-sm">
                                    <Bookmark
                                        size={44}
                                        className="mx-auto text-stone-300"
                                    />

                                    <h2 className="mt-4 text-xl font-bold text-slate-800">
                                        Todavía no tienes reservas
                                    </h2>

                                    <Link
                                        to="/catalogo"
                                        className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                                    >
                                        Explorar libros
                                    </Link>
                                </div>
                            )}

                        {!cargandoReservas &&
                            reservas.length > 0 && (
                                <div className="mt-5 space-y-4">
                                    {reservas.map((reserva) => (
                                        <article
                                            key={reserva.reservaId}
                                            className="rounded-2xl bg-white p-6 shadow-sm"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-xl bg-emerald-50 p-3 text-[#3D7669]">
                                                            <BookOpen size={22} />
                                                        </div>

                                                        <div>
                                                            <h2 className="text-lg font-bold text-slate-800">
                                                                {reserva.libro?.nombre ||
                                                                    "Libro sin título"}
                                                            </h2>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Reserva #{reserva.reservaId}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span>
                              Solicitada:{" "}
                                {formatearFecha(
                                    reserva.fechaSolicitud
                                )}
                            </span>

                                                        {reserva.fechaExpiracion && (
                                                            <span>
                                Expira:{" "}
                                                                {formatearFecha(
                                                                    reserva.fechaExpiracion
                                                                )}
                              </span>
                                                        )}
                                                    </div>

                                                    {reserva.codigoEjemplar && (
                                                        <p className="mt-3 text-sm text-slate-600">
                                                            Ejemplar:{" "}
                                                            <strong>
                                                                {reserva.codigoEjemplar}
                                                            </strong>
                                                        </p>
                                                    )}

                                                    {reserva.observaciones && (
                                                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                                                            {reserva.observaciones}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-start gap-3 sm:items-end">
                          <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(reserva.estado)}`}
                          >
                            {reserva.estado}
                          </span>

                                                    {reserva.estado === "Pendiente" && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                cancelandoId === reserva.reservaId
                                                            }
                                                            onClick={() =>
                                                                confirmarCancelacion(reserva)
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                                                        >
                                                            {cancelandoId ===
                                                            reserva.reservaId ? (
                                                                <RefreshCw
                                                                    size={17}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <XCircle size={17} />
                                                            )}

                                                            Cancelar reserva
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                    </section>
                )}
            </main>

            {/* DETALLE DE PRÉSTAMO */}
            {detalle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle de mi préstamo"
                        className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {detalle.codigoPrestamo}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Detalle de tu préstamo
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDetalle(null)}
                                aria-label="Cerrar detalle"
                                className="rounded-lg p-2 hover:bg-stone-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
              <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(detalle.estado)}`}
              >
                {detalle.estado}
              </span>

                            {detalle.vencido && (
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Vencido
                </span>
                            )}
                        </div>

                        <div className="grid gap-4 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-slate-500">Préstamo</p>
                                <p className="font-semibold">
                                    {formatearFecha(detalle.fechaPrestamo)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Vencimiento</p>
                                <p className="font-semibold">
                                    {formatearFecha(detalle.fechaVencimiento)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Política</p>
                                <p className="font-semibold">
                                    {detalle.politica || "No especificada"}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Días de retraso</p>
                                <p className="font-semibold">
                                    {detalle.diasRetraso ?? 0}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 font-bold text-slate-800">
                                Libros del préstamo
                            </h3>

                            <div className="space-y-3">
                                {Array.isArray(detalle.ejemplares) &&
                                    detalle.ejemplares.map((ejemplar) => (
                                        <div
                                            key={ejemplar.detallePrestamoId}
                                            className="rounded-xl border border-stone-200 p-4"
                                        >
                                            <p className="font-semibold text-slate-800">
                                                {ejemplar.libro?.nombre ||
                                                    "Libro sin título"}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Código: {ejemplar.codigoEjemplar}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Estado: {ejemplar.estado}
                                            </p>

                                            {ejemplar.fechaDevolucion && (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Devuelto:{" "}
                                                    {formatearFecha(
                                                        ejemplar.fechaDevolucion
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    ))}

                                {(!Array.isArray(detalle.ejemplares) ||
                                    detalle.ejemplares.length === 0) && (
                                    <p className="text-sm text-slate-500">
                                        No hay ejemplares registrados.
                                    </p>
                                )}
                            </div>
                        </div>

                        {detalle.observaciones && (
                            <p className="whitespace-pre-wrap text-sm text-slate-600">
                                Observaciones: {detalle.observaciones}
                            </p>
                        )}

                        <div className="flex justify-end border-t border-stone-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setDetalle(null)}
                                className="rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
