import { useCallback, useEffect, useState } from "react";

import {
    Search,
    UserPlus,
    Pencil,
    X,
    KeyRound,
    Power,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Users,
    ShieldCheck,
} from "lucide-react";

import {
    listarUsuarios,
    listarRoles,
    crearUsuario,
    actualizarUsuario,
    cambiarContrasenaUsuario,
    cambiarEstadoUsuario,
} from "../../services/usuariosAdmin";

const TAMANO_PAGINA = 10;

const FORMULARIO_VACIO = {
    usuarioId: null,
    nombreUsuario: "",
    nombreCompleto: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    rol: "",
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

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return "Sin registro";
    }

    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(valor);
}

export default function AdminUsersPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);

    const [buscar, setBuscar] = useState("");
    const [filtroRol, setFiltroRol] = useState("");
    const [filtroActivo, setFiltroActivo] = useState("");

    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cambiandoEstado, setCambiandoEstado] = useState(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    // Modal de registro y edición.
    const [modalAbierto, setModalAbierto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

    // Modal de cambio de contraseña.
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [nuevaContrasena, setNuevaContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [guardandoContrasena, setGuardandoContrasena] = useState(false);

    // Cargar roles disponibles desde el backend.
    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const resultado = await listarRoles();
                setRoles(resultado);
            } catch (err) {
                setError(
                    `No se pudieron cargar los roles: ${obtenerMensajeError(err)}`
                );
            }
        };

        cargarRoles();
    }, []);

    // Consultar usuarios con filtros y paginación.
    const cargarUsuarios = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const resultado = await listarUsuarios({
                q: buscar,
                rol: filtroRol || undefined,
                activo:
                    filtroActivo === ""
                        ? undefined
                        : filtroActivo === "true",
                page: pagina,
                size: TAMANO_PAGINA,
            });

            setUsuarios(extraerElementos(resultado));

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
            setUsuarios([]);
            setTotalPaginas(0);
            setTotalElementos(0);

            setError(
                `No se pudieron cargar los usuarios: ${obtenerMensajeError(err)}`
            );
        } finally {
            setCargando(false);
        }
    }, [buscar, filtroRol, filtroActivo, pagina]);

    useEffect(() => {
        cargarUsuarios();
    }, [cargarUsuarios]);

    // Abrir formulario de registro.
    const abrirNuevo = () => {
        setFormulario({
            ...FORMULARIO_VACIO,
            rol: roles[0]?.nombre || "",
        });

        setError("");
        setMensaje("");
        setModalAbierto(true);
    };

    // Abrir formulario de edición.
    const abrirEdicion = (usuario) => {
        setFormulario({
            usuarioId: usuario.usuarioId,
            nombreUsuario: usuario.nombreUsuario || "",
            nombreCompleto: usuario.nombreCompleto || "",
            correo: usuario.correo || "",
            contrasena: "",
            confirmarContrasena: "",
            rol: usuario.rol || "",
        });

        setError("");
        setMensaje("");
        setModalAbierto(true);
    };

    // Actualizar campos del formulario.
    const actualizarCampo = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    };

    // Guardar usuario nuevo o editar uno existente.
    const guardarUsuario = async (event) => {
        event.preventDefault();

        if (guardando) return;

        setError("");
        setMensaje("");

        const nombreCompleto = formulario.nombreCompleto.trim();
        const correo = formulario.correo.trim();
        const rol = formulario.rol;

        if (!roles.some((item) => item.nombre === rol)) {
            setError("Selecciona un rol válido.");
            return;
        }

        if (
            !/^[\p{L}\p{M}\s.'’-]+$/u.test(nombreCompleto) ||
            nombreCompleto.length < 3 ||
            nombreCompleto.length > 120
        ) {
            setError(
                "Ingresa un nombre completo válido, de 3 a 120 caracteres."
            );
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            setError("Ingresa un correo electrónico válido.");
            return;
        }

        try {
            setGuardando(true);

            if (formulario.usuarioId) {
                await actualizarUsuario(formulario.usuarioId, {
                    nombreCompleto,
                    correo,
                    rol,
                });

                setMensaje("Usuario actualizado correctamente.");
            } else {
                if (formulario.contrasena !== formulario.confirmarContrasena) {
                    setError("Las contraseñas no coinciden.");
                    return;
                }

                await crearUsuario({
                    nombreUsuario: formulario.nombreUsuario,
                    nombreCompleto,
                    correo,
                    contrasena: formulario.contrasena,
                    rol,
                });

                setMensaje("Usuario registrado correctamente.");
            }

            setModalAbierto(false);
            setFormulario(FORMULARIO_VACIO);

            await cargarUsuarios();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    // Activar o desactivar una cuenta.
    const cambiarEstado = async (usuario) => {
        const nuevoEstado = !usuario.activo;

        const accion = nuevoEstado ? "activar" : "desactivar";

        const confirmado = window.confirm(
            `¿Estás seguro de ${accion} la cuenta de ${usuario.nombreUsuario}?`
        );

        if (!confirmado) return;

        try {
            setCambiandoEstado(usuario.usuarioId);
            setError("");
            setMensaje("");

            await cambiarEstadoUsuario(
                usuario.usuarioId,
                nuevoEstado
            );

            setMensaje(
                `La cuenta de ${usuario.nombreUsuario} fue ${
                    nuevoEstado ? "activada" : "desactivada"
                } correctamente.`
            );

            await cargarUsuarios();
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setCambiandoEstado(null);
        }
    };

    // Abrir modal de cambio de contraseña.
    const abrirCambioContrasena = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setNuevaContrasena("");
        setConfirmarContrasena("");
        setError("");
        setMensaje("");
    };

    // Guardar nueva contraseña.
    const guardarNuevaContrasena = async (event) => {
        event.preventDefault();

        if (guardandoContrasena) return;

        if (nuevaContrasena.length < 8 || nuevaContrasena.length > 100) {
            setError(
                "La contraseña debe tener entre 8 y 100 caracteres."
            );
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setGuardandoContrasena(true);
            setError("");

            await cambiarContrasenaUsuario(
                usuarioSeleccionado.usuarioId,
                nuevaContrasena
            );

            setUsuarioSeleccionado(null);
            setMensaje("La contraseña se actualizó correctamente.");
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardandoContrasena(false);
        }
    };

    // Cambiar los filtros y regresar a la primera página.
    const actualizarFiltro = (campo, valor) => {
        setPagina(0);

        if (campo === "rol") {
            setFiltroRol(valor);
        }

        if (campo === "activo") {
            setFiltroActivo(valor);
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
                        Gestión de usuarios
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Administra las cuentas, los roles y los accesos al sistema.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={cargarUsuarios}
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
                        disabled={roles.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <UserPlus size={18} />
                        Nuevo usuario
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

            {/* ESTADÍSTICA */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Usuarios encontrados
                        </p>
                        <Users size={22} className="text-[#3D7669]" />
                    </div>

                    <p className="mt-4 text-3xl font-bold text-slate-800">
                        {totalElementos}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Roles disponibles
                        </p>
                        <ShieldCheck size={22} className="text-[#3D7669]" />
                    </div>

                    <p className="mt-4 text-3xl font-bold text-slate-800">
                        {roles.length}
                    </p>
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">

                {/* FILTROS */}
                <div className="grid gap-4 md:grid-cols-3">

                    <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 md:col-span-1">
                        <Search size={18} className="text-slate-400" />

                        <input
                            type="search"
                            maxLength={100}
                            aria-label="Buscar usuarios"
                            value={buscar}
                            onChange={(e) => {
                                setBuscar(e.target.value);
                                setPagina(0);
                            }}
                            placeholder="Buscar por nombre, usuario o correo..."
                            className="w-full text-sm outline-none"
                        />
                    </label>

                    <select
                        value={filtroRol}
                        onChange={(e) => actualizarFiltro("rol", e.target.value)}
                        className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                    >
                        <option value="">Todos los roles</option>

                        {roles.map((rol) => (
                            <option key={rol.rolId} value={rol.nombre}>
                                {rol.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filtroActivo}
                        onChange={(e) => actualizarFiltro("activo", e.target.value)}
                        className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                    >
                        <option value="">Todos los estados</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                </div>

                {/* TABLA */}
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 text-slate-500">
                        <tr>
                            <th className="p-3">Nombre completo</th>
                            <th className="p-3">Usuario</th>
                            <th className="p-3">Correo</th>
                            <th className="p-3">Rol</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3">Último acceso</th>
                            <th className="p-3 text-right">Acciones</th>
                        </tr>
                        </thead>

                        <tbody>
                        {usuarios.map((usuario) => (
                            <tr
                                key={usuario.usuarioId}
                                className="border-b border-stone-100 hover:bg-stone-50"
                            >
                                <td className="p-3 font-semibold text-slate-800">
                                    {usuario.nombreCompleto}
                                </td>

                                <td className="p-3">
                                    {usuario.nombreUsuario}
                                </td>

                                <td className="p-3">
                                    {usuario.correo}
                                </td>

                                <td className="p-3">
                    <span className="rounded-lg bg-[#F0F7F4] px-2 py-1 text-xs font-semibold text-[#315e55]">
                      {usuario.rol}
                    </span>
                                </td>

                                <td className="p-3">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            usuario.activo
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                                </td>

                                <td className="p-3 text-slate-500">
                                    {formatearFecha(usuario.ultimoAcceso)}
                                </td>

                                <td className="p-3">
                                    <div className="flex justify-end gap-1">

                                        <button
                                            type="button"
                                            title="Editar usuario"
                                            aria-label={`Editar ${usuario.nombreUsuario}`}
                                            onClick={() => abrirEdicion(usuario)}
                                            className="rounded-lg p-2 text-[#3D7669] hover:bg-emerald-50"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            title="Cambiar contraseña"
                                            aria-label={`Cambiar contraseña de ${usuario.nombreUsuario}`}
                                            onClick={() => abrirCambioContrasena(usuario)}
                                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                        >
                                            <KeyRound size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            title={usuario.activo ? "Desactivar" : "Activar"}
                                            aria-label={`${
                                                usuario.activo ? "Desactivar" : "Activar"
                                            } ${usuario.nombreUsuario}`}
                                            disabled={
                                                cambiandoEstado === usuario.usuarioId
                                            }
                                            onClick={() => cambiarEstado(usuario)}
                                            className={`rounded-lg p-2 disabled:opacity-40 ${
                                                usuario.activo
                                                    ? "text-red-600 hover:bg-red-50"
                                                    : "text-emerald-600 hover:bg-emerald-50"
                                            }`}
                                        >
                                            {cambiandoEstado === usuario.usuarioId ? (
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
                            Cargando usuarios desde el servidor...
                        </p>
                    )}

                    {!cargando && usuarios.length === 0 && (
                        <p className="py-10 text-center text-slate-500">
                            No se encontraron usuarios.
                        </p>
                    )}
                </div>

                {/* PAGINACIÓN */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">
                    <button
                        type="button"
                        disabled={pagina <= 0 || cargando}
                        onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
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
                        onClick={() => setPagina((actual) => actual + 1)}
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Siguiente
                        <ChevronRight size={17} />
                    </button>
                </div>
            </div>

            {/* MODAL REGISTRAR / EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={guardarUsuario}
                        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {formulario.usuarioId
                                        ? "Editar usuario"
                                        : "Nuevo usuario"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Completa los datos de la cuenta.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                aria-label="Cerrar formulario"
                                disabled={guardando}
                                className="rounded-lg p-2 hover:bg-stone-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {!formulario.usuarioId && (
                            <label className="block text-sm font-medium text-slate-700">
                                Nombre de usuario *
                                <input
                                    type="text"
                                    required
                                    minLength={3}
                                    maxLength={40}
                                    autoComplete="username"
                                    value={formulario.nombreUsuario}
                                    onChange={(e) =>
                                        actualizarCampo("nombreUsuario", e.target.value)
                                    }
                                    placeholder="Ej. usuario2026"
                                    className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                />
                            </label>
                        )}

                        {formulario.usuarioId && (
                            <div className="rounded-xl bg-stone-50 p-3 text-sm">
                                <p className="text-slate-500">Nombre de usuario</p>
                                <p className="mt-1 font-semibold text-slate-800">
                                    {formulario.nombreUsuario}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    El nombre de usuario no se modifica desde esta operación.
                                </p>
                            </div>
                        )}

                        <label className="block text-sm font-medium text-slate-700">
                            Nombre completo *
                            <input
                                type="text"
                                required
                                minLength={3}
                                maxLength={120}
                                value={formulario.nombreCompleto}
                                onChange={(e) =>
                                    actualizarCampo("nombreCompleto", e.target.value)
                                }
                                placeholder="Nombres y apellidos"
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                            />
                        </label>

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
                            Rol *
                            <select
                                required
                                value={formulario.rol}
                                onChange={(e) =>
                                    actualizarCampo("rol", e.target.value)
                                }
                                className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 outline-none focus:border-[#3D7669]"
                            >
                                <option value="">Selecciona un rol</option>

                                {roles.map((rol) => (
                                    <option key={rol.rolId} value={rol.nombre}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {!formulario.usuarioId && (
                            <>
                                <label className="block text-sm font-medium text-slate-700">
                                    Contraseña *
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        value={formulario.contrasena}
                                        onChange={(e) =>
                                            actualizarCampo("contrasena", e.target.value)
                                        }
                                        placeholder="Mínimo 8 caracteres"
                                        className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                    />
                                </label>

                                <label className="block text-sm font-medium text-slate-700">
                                    Confirmar contraseña *
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        value={formulario.confirmarContrasena}
                                        onChange={(e) =>
                                            actualizarCampo(
                                                "confirmarContrasena",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Repite la contraseña"
                                        className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                    />
                                </label>
                            </>
                        )}

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
                                disabled={guardando || roles.length === 0}
                                className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {guardando && (
                                    <RefreshCw size={17} className="animate-spin" />
                                )}

                                {guardando
                                    ? "Guardando..."
                                    : formulario.usuarioId
                                        ? "Guardar cambios"
                                        : "Registrar usuario"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL CAMBIAR CONTRASEÑA */}
            {usuarioSeleccionado && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={guardarNuevaContrasena}
                        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Cambiar contraseña
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Usuario: {usuarioSeleccionado.nombreUsuario}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setUsuarioSeleccionado(null)}
                                disabled={guardandoContrasena}
                                aria-label="Cerrar"
                                className="rounded-lg p-2 hover:bg-stone-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <label className="block text-sm font-medium text-slate-700">
                            Nueva contraseña *
                            <input
                                type="password"
                                required
                                minLength={8}
                                maxLength={100}
                                autoComplete="new-password"
                                value={nuevaContrasena}
                                onChange={(e) => setNuevaContrasena(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Confirmar nueva contraseña *
                            <input
                                type="password"
                                required
                                minLength={8}
                                maxLength={100}
                                autoComplete="new-password"
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                placeholder="Repite la contraseña"
                            />
                        </label>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setUsuarioSeleccionado(null)}
                                disabled={guardandoContrasena}
                                className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={guardandoContrasena}
                                className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                                {guardandoContrasena ? (
                                    <RefreshCw size={17} className="animate-spin" />
                                ) : (
                                    <KeyRound size={17} />
                                )}

                                {guardandoContrasena
                                    ? "Actualizando..."
                                    : "Cambiar contraseña"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}