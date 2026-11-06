import { useCallback, useEffect, useState } from "react";

import {
    Search,
    UserPlus,
    Pencil,
    X,
    Power,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Users,
    Eye,
} from "lucide-react";

import {
    listarLectores,
    obtenerLectorPorId,
    crearLector,
    actualizarLector,
    cambiarEstadoLector,
} from "../../services/lectoresAdmin";

const TAMANO_PAGINA = 10;

const FORMULARIO_VACIO = {
    documento: "",
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    direccion: "",
};

function extraerElementos(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;

    return [];
}

function obtenerMensajeError(error) {
    return (
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        error?.message ||
        "Ocurrió un error inesperado."
    );
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin registro";

    const valor = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(fecha)
            ? `${fecha}T00:00:00`
            : fecha
    );

    if (Number.isNaN(valor.getTime())) {
        return "Sin registro";
    }

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
    }).format(valor);
}

export default function AdminReadersPage() {
    const [lectores, setLectores] = useState([]);

    const [buscar, setBuscar] = useState("");

    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cambiandoEstado, setCambiandoEstado] = useState(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [modalAbierto, setModalAbierto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [lectorEditando, setLectorEditando] = useState(null);

    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // Cargar lectores desde el backend.
    const cargarLectores = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const resultado = await listarLectores({
                q: buscar,
                page: pagina,
                size: TAMANO_PAGINA,
            });

            setLectores(extraerElementos(resultado));

            setTotalPaginas(
                Number(
                    resultado?.totalPaginas ??
                    resultado?.totalPages ??
                    0
                )
            );

            setTotalElementos(
                Number(
                    resultado?.totalElementos ??
                    resultado?.totalElements ??
                    0
                )
            );
        } catch (err) {
            setLectores([]);
            setTotalPaginas(0);
            setTotalElementos(0);

            setError(
                `No se pudieron cargar los lectores: ${obtenerMensajeError(err)}`
            );
        } finally {
            setCargando(false);
        }
    }, [buscar, pagina]);

    useEffect(() => {
        cargarLectores();
    }, [cargarLectores]);

    // Validar los datos antes de enviarlos.
    const validarFormulario = () => {
        const documento = formulario.documento.trim();
        const nombres = formulario.nombres.trim();
        const apellidos = formulario.apellidos.trim();
        const correo = formulario.correo.trim();
        const telefono = formulario.telefono.trim();
        const direccion = formulario.direccion.trim();

        if (!/^\d{8}$/.test(documento)) {
            return "El DNI debe contener exactamente 8 dígitos.";
        }

        if (
            !/^[\p{L}\p{M}\s.'’-]+$/u.test(nombres) ||
            nombres.length < 2 ||
            nombres.length > 80
        ) {
            return "Ingresa nombres válidos, de 2 a 80 caracteres.";
        }

        if (
            !/^[\p{L}\p{M}\s.'’-]+$/u.test(apellidos) ||
            apellidos.length < 2 ||
            apellidos.length > 80
        ) {
            return "Ingresa apellidos válidos, de 2 a 80 caracteres.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return "Ingresa un correo electrónico válido.";
        }

        if (!/^\d{9}$/.test(telefono)) {
            return "El teléfono debe contener exactamente 9 dígitos.";
        }

        if (direccion.length < 5 || direccion.length > 250) {
            return "La dirección debe tener entre 5 y 250 caracteres.";
        }

        return "";
    };

    // Abrir formulario para registrar.
    const abrirNuevo = () => {
        setLectorEditando(null);
        setFormulario(FORMULARIO_VACIO);

        setError("");
        setMensaje("");
        setModalAbierto(true);
    };

    // Abrir formulario para editar consultando el detalle real.
    const abrirEdicion = async (lector) => {
        try {
            setCargandoDetalle(true);
            setError("");
            setMensaje("");

            const detalle = await obtenerLectorPorId(lector.lectorId);

            setLectorEditando(detalle);

            setFormulario({
                documento: detalle.documento || "",
                nombres: detalle.nombres || "",
                apellidos: detalle.apellidos || "",
                correo: detalle.correo || "",
                telefono: detalle.telefono || "",
                direccion: detalle.direccion || "",
            });

            setModalAbierto(true);
        } catch (err) {
            setError(
                `No se pudo consultar el lector: ${obtenerMensajeError(err)}`
            );
        } finally {
            setCargandoDetalle(false);
        }
    };

    // Actualizar campos del formulario.
    const actualizarCampo = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    };

    // Guardar un lector nuevo o actualizar uno existente.
    const guardarLector = async (event) => {
        event.preventDefault();

        if (guardando) return;

        setError("");
        setMensaje("");

        const errorValidacion = validarFormulario();

        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        const datos = {
            documento: formulario.documento.trim(),
            nombres: formulario.nombres.trim(),
            apellidos: formulario.apellidos.trim(),
            correo: formulario.correo.trim(),
            telefono: formulario.telefono.trim(),
            direccion: formulario.direccion.trim(),
        };

        try {
            setGuardando(true);

            if (lectorEditando) {
                await actualizarLector(
                    lectorEditando.lectorId,
                    datos
                );

                setMensaje("Lector actualizado correctamente.");
            } else {
                await crearLector(datos);

                setMensaje("Lector registrado correctamente.");
            }

            setModalAbierto(false);
            setFormulario(FORMULARIO_VACIO);
            setLectorEditando(null);

            setPagina(0);

            if (pagina === 0) {
                await cargarLectores();
            }
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    // Activar o desactivar lector.
    const cambiarEstado = async (lector) => {
        const nuevoEstado = !lector.activo;

        const accion = nuevoEstado ? "activar" : "desactivar";

        const confirmado = window.confirm(
            `¿Estás seguro de ${accion} a ${lector.nombreCompleto}?`
        );

        if (!confirmado) return;

        try {
            setCambiandoEstado(lector.lectorId);
            setError("");
            setMensaje("");

            await cambiarEstadoLector(
                lector.lectorId,
                nuevoEstado
            );

            setMensaje(
                `${lector.nombreCompleto} fue ${
                    nuevoEstado ? "activado" : "desactivado"
                } correctamente.`
            );

            await cargarLectores();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setCambiandoEstado(null);
        }
    };

    return (
        <main className="mx-auto max-w-7xl p-6 md:p-10">

            {/* ENCABEZADO */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#3D7669]">
                        Administración
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-800">
                        Gestión de lectores
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Administra el registro y los datos de los lectores.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={cargarLectores}
                        disabled={cargando}
                        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 font-semibold text-slate-600 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={18}
                            className={cargando ? "animate-spin" : ""}
                        />
                        Actualizar
                    </button>

                    <button
                        type="button"
                        onClick={abrirNuevo}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white hover:bg-[#315e55]"
                    >
                        <UserPlus size={18} />
                        Nuevo lector
                    </button>
                </div>
            </div>

            {/* MENSAJES */}
            {error && (
                <div
                    role="alert"
                    className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {mensaje && (
                <div
                    role="status"
                    className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    {mensaje}
                </div>
            )}

            {/* RESUMEN */}
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            Lectores registrados
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-800">
                            {totalElementos}
                        </p>
                    </div>

                    <Users size={28} className="text-[#3D7669]" />
                </div>
            </div>

            {/* TABLA */}
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">

                {/* BÚSQUEDA */}
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3">
                    <Search size={18} className="text-slate-400" />

                    <input
                        type="search"
                        maxLength={100}
                        aria-label="Buscar lectores"
                        value={buscar}
                        onChange={(e) => {
                            setBuscar(e.target.value);
                            setPagina(0);
                        }}
                        placeholder="Buscar por DNI, nombre, correo o teléfono..."
                        className="w-full text-sm outline-none"
                    />
                </label>

                {/* TABLA DE LECTORES */}
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 text-slate-500">
                        <tr>
                            <th className="p-3">Documento</th>
                            <th className="p-3">Nombre completo</th>
                            <th className="p-3">Correo</th>
                            <th className="p-3">Teléfono</th>
                            <th className="p-3">Fecha de registro</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Acciones</th>
                        </tr>
                        </thead>

                        <tbody>
                        {lectores.map((lector) => (
                            <tr
                                key={lector.lectorId}
                                className="border-b border-stone-100 hover:bg-stone-50"
                            >
                                <td className="p-3 font-semibold text-slate-800">
                                    {lector.documento}
                                </td>

                                <td className="p-3">
                                    {lector.nombreCompleto ||
                                        `${lector.nombres || ""} ${lector.apellidos || ""}`}
                                </td>

                                <td className="p-3">
                                    {lector.correo}
                                </td>

                                <td className="p-3">
                                    {lector.telefono}
                                </td>

                                <td className="p-3 text-slate-500">
                                    {formatearFecha(lector.fechaRegistro)}
                                </td>

                                <td className="p-3">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            lector.activo
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                      {lector.activo ? "Activo" : "Inactivo"}
                    </span>
                                </td>

                                <td className="p-3">
                                    <div className="flex justify-end gap-1">

                                        <button
                                            type="button"
                                            title="Consultar y editar"
                                            aria-label={`Consultar ${lector.nombreCompleto}`}
                                            disabled={cargandoDetalle}
                                            onClick={() => abrirEdicion(lector)}
                                            className="rounded-lg p-2 text-[#3D7669] hover:bg-emerald-50 disabled:opacity-40"
                                        >
                                            {cargandoDetalle ? (
                                                <RefreshCw size={18} className="animate-spin" />
                                            ) : (
                                                <Pencil size={18} />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            title={lector.activo ? "Desactivar lector" : "Activar lector"}
                                            aria-label={`${
                                                lector.activo ? "Desactivar" : "Activar"
                                            } ${lector.nombreCompleto}`}
                                            disabled={cambiandoEstado === lector.lectorId}
                                            onClick={() => cambiarEstado(lector)}
                                            className={`rounded-lg p-2 disabled:opacity-40 ${
                                                lector.activo
                                                    ? "text-red-600 hover:bg-red-50"
                                                    : "text-emerald-600 hover:bg-emerald-50"
                                            }`}
                                        >
                                            {cambiandoEstado === lector.lectorId ? (
                                                <RefreshCw size={18} className="animate-spin" />
                                            ) : (
                                                <Power size={18} />
                                            )}
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {cargando && (
                        <p className="py-10 text-center text-slate-500">
                            Cargando lectores desde el servidor...
                        </p>
                    )}

                    {!cargando && lectores.length === 0 && (
                        <p className="py-10 text-center text-slate-500">
                            No se encontraron lectores.
                        </p>
                    )}
                </div>

                {/* PAGINACIÓN */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">

                    <button
                        type="button"
                        disabled={pagina <= 0 || cargando}
                        onClick={() =>
                            setPagina((actual) => Math.max(0, actual - 1))
                        }
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={17} />
                        Anterior
                    </button>

                    <span className="text-sm text-slate-500">
            Página {pagina + 1} de {Math.max(1, totalPaginas)}
          </span>

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
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Siguiente
                        <ChevronRight size={17} />
                    </button>
                </div>
            </div>

            {/* MODAL NUEVO / EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

                    <form
                        onSubmit={guardarLector}
                        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    >

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {lectorEditando ? "Editar lector" : "Nuevo lector"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Completa los datos personales del lector.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                disabled={guardando}
                                aria-label="Cerrar formulario"
                                className="rounded-lg p-2 hover:bg-stone-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <label className="block text-sm font-medium text-slate-700">
                            DNI *
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{8}"
                                minLength={8}
                                maxLength={8}
                                required
                                value={formulario.documento}
                                onChange={(e) =>
                                    actualizarCampo(
                                        "documento",
                                        e.target.value.replace(/\D/g, "").slice(0, 8)
                                    )
                                }
                                placeholder="Ingresa 8 dígitos"
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                            />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Nombres *
                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={80}
                                    value={formulario.nombres}
                                    onChange={(e) =>
                                        actualizarCampo("nombres", e.target.value)
                                    }
                                    placeholder="Nombres"
                                    className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                />
                            </label>

                            <label className="block text-sm font-medium text-slate-700">
                                Apellidos *
                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={80}
                                    value={formulario.apellidos}
                                    onChange={(e) =>
                                        actualizarCampo("apellidos", e.target.value)
                                    }
                                    placeholder="Apellidos"
                                    className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                />
                            </label>
                        </div>

                        <label className="block text-sm font-medium text-slate-700">
                            Correo electrónico *
                            <input
                                type="email"
                                required
                                maxLength={150}
                                value={formulario.correo}
                                onChange={(e) =>
                                    actualizarCampo("correo", e.target.value)
                                }
                                placeholder="correo@ejemplo.com"
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                            />
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Teléfono *
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]{9}"
                                minLength={9}
                                maxLength={9}
                                required
                                value={formulario.telefono}
                                onChange={(e) =>
                                    actualizarCampo(
                                        "telefono",
                                        e.target.value.replace(/\D/g, "").slice(0, 9)
                                    )
                                }
                                placeholder="999999999"
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                            />
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Dirección *
                            <textarea
                                required
                                minLength={5}
                                maxLength={250}
                                rows={3}
                                value={formulario.direccion}
                                onChange={(e) =>
                                    actualizarCampo("direccion", e.target.value)
                                }
                                placeholder="Dirección completa del lector"
                                className="mt-1 w-full resize-none rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                            />
                        </label>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                disabled={guardando}
                                className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {guardando && (
                                    <RefreshCw size={17} className="animate-spin" />
                                )}

                                {guardando
                                    ? "Guardando..."
                                    : lectorEditando
                                        ? "Guardar cambios"
                                        : "Registrar lector"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}