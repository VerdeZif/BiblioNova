
import { useCallback, useEffect, useState } from "react";
import {
    MapPin,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Star,
} from "lucide-react";

import {
    listarMisDirecciones,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion,
} from "../../services/direcciones";

const FORMULARIO_VACIO = {
    destinatario: "",
    telefono: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    referencia: "",
    predeterminada: false,
};

const CAMPOS = [
    { nombre: "destinatario", etiqueta: "Destinatario", requerido: true },
    { nombre: "telefono", etiqueta: "Teléfono", requerido: true },
    { nombre: "departamento", etiqueta: "Departamento", requerido: true },
    { nombre: "provincia", etiqueta: "Provincia", requerido: true },
    { nombre: "distrito", etiqueta: "Distrito", requerido: true },
    { nombre: "direccion", etiqueta: "Dirección", requerido: true },
    { nombre: "referencia", etiqueta: "Referencia", requerido: false },
];

function mensajeError(error) {
    const estado = error?.response?.status;
    const datos = error?.response?.data;

    if (estado === 401) {
        return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    }

    if (estado === 403) {
        return "No tienes permiso para modificar esta dirección.";
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

export default function MisDirecciones() {
    const [direcciones, setDirecciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [editandoId, setEditandoId] = useState(null);
    const [formulario, setFormulario] = useState(
        { ...FORMULARIO_VACIO }
    );

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargarDirecciones = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const resultado = await listarMisDirecciones();

            setDirecciones(resultado);
        } catch (err) {
            setDirecciones([]);
            setError(mensajeError(err));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDirecciones();
    }, [cargarDirecciones]);

    const abrirNuevo = () => {
        setEditandoId(null);
        setFormulario({
            ...FORMULARIO_VACIO,
            predeterminada: direcciones.length === 0,
        });
        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const abrirEditar = (direccion) => {
        setEditandoId(direccion.direccionId);

        setFormulario({
            destinatario: direccion.destinatario ?? "",
            telefono: direccion.telefono ?? "",
            departamento: direccion.departamento ?? "",
            provincia: direccion.provincia ?? "",
            distrito: direccion.distrito ?? "",
            direccion: direccion.direccion ?? "",
            referencia: direccion.referencia ?? "",
            predeterminada: direccion.predeterminada === true,
        });

        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const cerrarFormulario = () => {
        if (guardando) return;

        setMostrarFormulario(false);
        setEditandoId(null);
        setFormulario({ ...FORMULARIO_VACIO });
    };

    const actualizarCampo = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    };

    const guardarDireccion = async (evento) => {
        evento.preventDefault();

        if (guardando) return;

        setError("");
        setMensaje("");

        try {
            setGuardando(true);

            if (editandoId !== null) {
                await actualizarDireccion(
                    editandoId,
                    formulario
                );
                setMensaje("Dirección actualizada correctamente.");
            } else {
                await crearDireccion(formulario);
                setMensaje("Dirección registrada correctamente.");
            }

            setMostrarFormulario(false);
            setEditandoId(null);
            setFormulario({ ...FORMULARIO_VACIO });

            await cargarDirecciones();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = async (direccion) => {
        if (eliminandoId !== null || guardando) return;

        const confirmado = window.confirm(
            `¿Deseas eliminar la dirección de ${direccion.destinatario}?`
        );

        if (!confirmado) return;

        try {
            setEliminandoId(direccion.direccionId);
            setError("");
            setMensaje("");

            await eliminarDireccion(direccion.direccionId);

            setMensaje("Dirección eliminada correctamente.");
            await cargarDirecciones();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setEliminandoId(null);
        }
    };

    const marcarPredeterminada = async (direccion) => {
        if (
            direccion.predeterminada ||
            guardando ||
            eliminandoId !== null
        ) {
            return;
        }

        try {
            setGuardando(true);
            setError("");
            setMensaje("");

            await actualizarDireccion(
                direccion.direccionId,
                {
                    ...direccion,
                    predeterminada: true,
                }
            );

            setMensaje("Dirección predeterminada actualizada.");
            await cargarDirecciones();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
            {/* ENCABEZADO */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                        <MapPin size={24} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Mis direcciones
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Administra tus direcciones de entrega.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={abrirNuevo}
                    disabled={guardando || eliminandoId !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-3 text-sm font-semibold text-white hover:bg-[#315e55] disabled:opacity-50"
                >
                    <Plus size={18} />
                    Agregar dirección
                </button>
            </div>

            {/* MENSAJES */}
            {error && (
                <div
                    role="alert"
                    className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {mensaje && (
                <div
                    role="status"
                    className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>{mensaje}</span>
                </div>
            )}

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <form
                    onSubmit={guardarDireccion}
                    className="mt-6 rounded-2xl border border-stone-200 bg-[#F8F6F1] p-5"
                >
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">
                            {editandoId !== null
                                ? "Editar dirección"
                                : "Nueva dirección"}
                        </h3>

                        <button
                            type="button"
                            onClick={cerrarFormulario}
                            disabled={guardando}
                            aria-label="Cerrar formulario"
                            className="rounded-lg p-2 text-slate-500 hover:bg-stone-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {CAMPOS.map((campo) => (
                            <label
                                key={campo.nombre}
                                className={`block text-sm font-semibold text-slate-700 ${
                                    campo.nombre === "direccion" ||
                                    campo.nombre === "referencia"
                                        ? "sm:col-span-2"
                                        : ""
                                }`}
                            >
                                {campo.etiqueta}
                                {campo.requerido && " *"}

                                <input
                                    type={campo.nombre === "telefono" ? "tel" : "text"}
                                    required={campo.requerido}
                                    disabled={guardando}
                                    value={formulario[campo.nombre]}
                                    onChange={(e) =>
                                        actualizarCampo(
                                            campo.nombre,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Ingresa ${campo.etiqueta.toLowerCase()}`}
                                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#3D7669] disabled:opacity-60"
                                />
                            </label>
                        ))}
                    </div>

                    <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={formulario.predeterminada}
                            onChange={(e) =>
                                actualizarCampo(
                                    "predeterminada",
                                    e.target.checked
                                )
                            }
                            disabled={guardando}
                            className="h-4 w-4 accent-[#3D7669]"
                        />

                        Establecer como dirección predeterminada
                    </label>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {guardando ? (
                                <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={18} />
                            )}

                            {guardando ? "Guardando..." : "Guardar dirección"}
                        </button>

                        <button
                            type="button"
                            onClick={cerrarFormulario}
                            disabled={guardando}
                            className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* CARGANDO */}
            {cargando && (
                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-stone-50 p-8 text-slate-500">
                    <RefreshCw size={18} className="animate-spin" />
                    Cargando direcciones...
                </div>
            )}

            {/* SIN DIRECCIONES */}
            {!cargando && !error && direcciones.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-stone-200 p-8 text-center">
                    <MapPin
                        size={38}
                        className="mx-auto text-stone-300"
                    />

                    <h3 className="mt-4 font-bold text-slate-800">
                        Todavía no tienes direcciones
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Agrega una dirección para utilizarla
                        en tus próximos pedidos.
                    </p>
                </div>
            )}

            {/* LISTADO REAL */}
            {!cargando && direcciones.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {direcciones.map((direccion) => (
                        <article
                            key={direccion.direccionId}
                            className={`rounded-2xl border p-5 ${
                                direccion.predeterminada
                                    ? "border-[#3D7669] bg-[#F0F7F4]"
                                    : "border-stone-200 bg-white"
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <h3 className="font-bold text-slate-800">
                                    {direccion.destinatario}
                                </h3>

                                {direccion.predeterminada && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-[#3D7669]">
                    <Star size={13} />
                    Predeterminada
                  </span>
                                )}
                            </div>

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                {direccion.direccion}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                {[
                                    direccion.distrito,
                                    direccion.provincia,
                                    direccion.departamento,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>

                            <p className="mt-3 text-sm text-slate-600">
                                Teléfono: {direccion.telefono}
                            </p>

                            {direccion.referencia && (
                                <p className="mt-2 text-sm text-slate-500">
                                    Referencia: {direccion.referencia}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => abrirEditar(direccion)}
                                    disabled={guardando || eliminandoId !== null}
                                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                                >
                                    <Pencil size={15} />
                                    Editar
                                </button>

                                {!direccion.predeterminada && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            marcarPredeterminada(direccion)
                                        }
                                        disabled={guardando || eliminandoId !== null}
                                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-[#3D7669] disabled:opacity-50"
                                    >
                                        <Star size={15} />
                                        Predeterminada
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        confirmarEliminar(direccion)
                                    }
                                    disabled={guardando || eliminandoId !== null}
                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                    {eliminandoId === direccion.direccionId ? (
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Trash2 size={15} />
                                    )}
                                    Eliminar
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
