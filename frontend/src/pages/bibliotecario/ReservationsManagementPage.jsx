
import { useCallback, useEffect, useState } from "react";

import {
    BookmarkCheck,
    BookOpen,
    CalendarDays,
    Clock3,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Users,
    Filter,
} from "lucide-react";

import { listarReservas } from "../../services/reservas";

const TAMANO_PAGINA = 10;

function obtenerMensajeError(error) {
    const status = error?.response?.status;
    const datos = error?.response?.data;

    if (status === 401) {
        return "La sesión no es válida o ha expirado. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "No tienes permisos para consultar las reservas.";
    }

    if (typeof datos === "string" && datos.trim()) {
        return datos;
    }

    return (
        datos?.mensaje ||
        datos?.message ||
        error?.message ||
        "Ocurrió un error inesperado."
    );
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

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

function claseEstado(estado) {
    switch (estado) {
        case "Pendiente":
            return "bg-amber-50 text-amber-700";

        case "Confirmada":
            return "bg-blue-50 text-blue-700";

        case "Atendida":
            return "bg-emerald-50 text-emerald-700";

        case "Cancelada":
            return "bg-red-50 text-red-700";

        default:
            return "bg-slate-100 text-slate-700";
    }
}

export default function ReservationsManagementPage() {
    const [reservas, setReservas] = useState([]);

    const [filtroEstado, setFiltroEstado] = useState("");

    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargarReservas = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const resultado = await listarReservas({
                estado: filtroEstado || undefined,
                page: pagina,
                size: TAMANO_PAGINA,
            });

            if (!Array.isArray(resultado?.contenido)) {
                throw new Error(
                    "El servidor no devolvió una lista válida de reservas."
                );
            }

            setReservas(resultado.contenido);

            const paginas = Number(resultado.totalPaginas ?? 0);

            setTotalPaginas(paginas);
            setTotalElementos(
                Number(resultado.totalElementos ?? 0)
            );

            if (pagina > 0 && pagina >= paginas) {
                setPagina(Math.max(0, paginas - 1));
            }
        } catch (err) {
            setReservas([]);
            setTotalElementos(0);
            setTotalPaginas(0);
            setError(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
    }, [filtroEstado, pagina]);

    useEffect(() => {
        cargarReservas();
    }, [cargarReservas]);

    const pendientesPagina = reservas.filter(
        (reserva) => reserva.estado === "Pendiente"
    ).length;

    const confirmadasPagina = reservas.filter(
        (reserva) => reserva.estado === "Confirmada"
    ).length;

    const cambiarEstado = (valor) => {
        setFiltroEstado(valor);
        setPagina(0);
    };

    return (
        <div className="min-h-screen">
            <main className="mx-auto max-w-6xl px-5 py-10">

                {/* ENCABEZADO */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#3D7669]">
                            Bibliotecario
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-slate-800">
                            Gestión de reservas
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Consulta las reservas de libros, sus lectores,
                            estados y ejemplares asignados.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cargarReservas}
                        disabled={cargando}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={18}
                            className={cargando ? "animate-spin" : ""}
                        />
                        Actualizar
                    </button>
                </div>

                {/* RESUMEN */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Reservas encontradas
                            </p>
                            <BookmarkCheck
                                size={22}
                                className="text-[#3D7669]"
                            />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-[#3D7669]">
                            {totalElementos}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Pendientes en esta página
                            </p>
                            <Clock3
                                size={22}
                                className="text-amber-600"
                            />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-800">
                            {pendientesPagina}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Confirmadas en esta página
                            </p>
                            <Users
                                size={22}
                                className="text-blue-600"
                            />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-800">
                            {confirmadasPagina}
                        </p>
                    </div>
                </div>

                {/* ERRORES */}
                {error && (
                    <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle
                            size={20}
                            className="shrink-0"
                        />
                        <span>{error}</span>
                    </div>
                )}

                {/* FILTROS */}
                <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Filter
                                size={18}
                                className="text-[#3D7669]"
                            />
                            Filtrar por estado
                        </div>

                        <select
                            value={filtroEstado}
                            onChange={(e) =>
                                cambiarEstado(e.target.value)
                            }
                            className="min-w-48 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                            aria-label="Filtrar reservas por estado"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Confirmada">Confirmada</option>
                        </select>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        Los filtros usan los estados confirmados en
                        el backend hasta ahora.
                    </p>
                </div>

                {/* LISTADO */}
                <div className="mt-6 space-y-4">

                    {cargando && (
                        <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-10 text-slate-500 shadow-sm">
                            <RefreshCw
                                size={20}
                                className="animate-spin"
                            />
                            Cargando reservas...
                        </div>
                    )}

                    {!cargando && !error && reservas.length === 0 && (
                        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                            <BookmarkCheck
                                size={44}
                                className="mx-auto text-stone-300"
                            />

                            <h2 className="mt-4 text-lg font-bold text-slate-800">
                                No se encontraron reservas
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                No hay registros para el filtro seleccionado.
                            </p>
                        </div>
                    )}

                    {!cargando &&
                        reservas.map((reserva) => (
                            <article
                                key={reserva.reservaId}
                                className="rounded-2xl bg-white p-6 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                        <div className="rounded-xl bg-[#F0F7F4] p-3 text-[#3D7669]">
                                            <BookOpen size={24} />
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <h2 className="text-lg font-bold text-slate-800">
                                                {reserva.libro?.nombre ||
                                                    "Libro sin título"}
                                            </h2>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Reserva #{reserva.reservaId}
                                            </p>

                                            <p className="mt-3 text-sm text-slate-600">
                                                Lector:{" "}
                                                <strong>
                                                    {reserva.lector?.nombre ||
                                                        "Sin nombre"}
                                                </strong>
                                            </p>

                                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={16} />
                          Solicitada:{" "}
                            {formatearFecha(
                                reserva.fechaSolicitud
                            )}
                        </span>

                                                {reserva.fechaExpiracion && (
                                                    <span className="inline-flex items-center gap-2">
                            <Clock3 size={16} />
                            Expira:{" "}
                                                        {formatearFecha(
                                                            reserva.fechaExpiracion
                                                        )}
                          </span>
                                                )}
                                            </div>

                                            {reserva.codigoEjemplar && (
                                                <p className="mt-3 text-sm text-slate-600">
                                                    Ejemplar asignado:{" "}
                                                    <strong className="text-[#3D7669]">
                                                        {reserva.codigoEjemplar}
                                                    </strong>
                                                </p>
                                            )}

                                            {reserva.observaciones && (
                                                <div className="mt-4 rounded-xl bg-stone-50 p-3">
                                                    <p className="text-xs font-semibold text-slate-700">
                                                        Observaciones
                                                    </p>

                                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                                                        {reserva.observaciones}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                                            reserva.estado
                                        )}`}
                                    >
                    {reserva.estado || "Sin estado"}
                  </span>
                                </div>
                            </article>
                        ))}
                </div>

                {/* PAGINACIÓN */}
                <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <button
                        type="button"
                        disabled={pagina === 0 || cargando}
                        onClick={() =>
                            setPagina((anterior) =>
                                Math.max(0, anterior - 1)
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    >
                        <ChevronLeft size={17} />
                        Anterior
                    </button>

                    <span className="text-center text-sm text-slate-500">
            Página {pagina + 1} de{" "}
                        {Math.max(1, totalPaginas)}
          </span>

                    <button
                        type="button"
                        disabled={
                            cargando ||
                            totalPaginas === 0 ||
                            pagina + 1 >= totalPaginas
                        }
                        onClick={() =>
                            setPagina((anterior) => anterior + 1)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    >
                        Siguiente
                        <ChevronRight size={17} />
                    </button>
                </div>

            </main>
        </div>
    );
}
