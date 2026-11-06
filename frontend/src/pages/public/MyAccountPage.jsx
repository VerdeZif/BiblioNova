import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    UserRound,
    Mail,
    BookOpen,
    ShoppingBag,
    Bookmark,
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    IdCard,
    Phone,
    MapPin,
    CalendarDays,
    KeyRound,
    ChevronRight,
    Eye,
    EyeOff,
    CheckCircle2,
    LockKeyhole,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import { cambiarMiContrasena } from "../../services/miCuenta";
import MisDirecciones from "../../components/cuenta/MisDirecciones";

const CONTRASENAS_VACIAS = {
    contrasenaActual: "",
    contrasenaNueva: "",
    confirmarContrasena: "",
};

function obtenerError(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
        return "El servidor rechazó la autenticación. Comprueba tu sesión y tu contraseña actual.";
    }

    if (status === 403) {
        return "No tienes permisos para realizar esta operación.";
    }

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    return (
        data?.mensaje ||
        data?.message ||
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
    }).format(valor);
}

function CampoInformacion({
                              icono: Icono,
                              etiqueta,
                              valor,
                          }) {
    return (
        <div className="flex items-start gap-3 rounded-xl bg-[#F8F6F1] p-4">
            <div className="rounded-lg bg-white p-2 text-[#3D7669]">
                <Icono size={19} />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                    {etiqueta}
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {valor || "No disponible"}
                </p>
            </div>
        </div>
    );
}

export default function MyAccountPage() {
    const [cuenta, setCuenta] = useState(null);
    const [lector, setLector] = useState(null);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [avisoLector, setAvisoLector] = useState("");

    // Contraseña.
    const [formulario, setFormulario] = useState(
        CONTRASENAS_VACIAS
    );

    const [mostrarContrasenas, setMostrarContrasenas] =
        useState(false);

    const [guardandoContrasena, setGuardandoContrasena] =
        useState(false);

    const [errorContrasena, setErrorContrasena] = useState("");
    const [mensajeContrasena, setMensajeContrasena] =
        useState("");

    const cargarPerfil = useCallback(async () => {
        setCargando(true);
        setError("");
        setAvisoLector("");

        try {
            const respuestaCuenta = await api.get("/auth/me");

            setCuenta(respuestaCuenta.data);

            try {
                const respuestaLector = await api.get(
                    "/prestamos/lectores/yo"
                );

                setLector(respuestaLector.data);
            } catch (err) {
                setLector(null);

                if (err?.response?.status === 404) {
                    setAvisoLector(
                        "Tu cuenta todavía no tiene un perfil de lector asociado."
                    );
                } else {
                    setAvisoLector(
                        `No se pudo consultar tu perfil de lector: ${obtenerError(err)}`
                    );
                }
            }
        } catch (err) {
            setCuenta(null);
            setLector(null);
            setError(obtenerError(err));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarPerfil();
    }, [cargarPerfil]);

    const actualizarContrasena = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));

        setErrorContrasena("");
        setMensajeContrasena("");
    };

    const guardarContrasena = async (event) => {
        event.preventDefault();

        if (guardandoContrasena) return;

        setErrorContrasena("");
        setMensajeContrasena("");

        const {
            contrasenaActual,
            contrasenaNueva,
            confirmarContrasena,
        } = formulario;

        if (!contrasenaActual) {
            setErrorContrasena(
                "Debes escribir tu contraseña actual."
            );
            return;
        }

        if (
            contrasenaNueva.length < 8 ||
            contrasenaNueva.length > 100
        ) {
            setErrorContrasena(
                "La nueva contraseña debe tener entre 8 y 100 caracteres."
            );
            return;
        }

        if (contrasenaNueva !== confirmarContrasena) {
            setErrorContrasena(
                "La confirmación no coincide con la nueva contraseña."
            );
            return;
        }

        if (contrasenaActual === contrasenaNueva) {
            setErrorContrasena(
                "La nueva contraseña debe ser diferente de la actual."
            );
            return;
        }

        try {
            setGuardandoContrasena(true);

            await cambiarMiContrasena({
                contrasenaActual,
                contrasenaNueva,
            });

            setFormulario({ ...CONTRASENAS_VACIAS });
            setMostrarContrasenas(false);

            setMensajeContrasena(
                "Tu contraseña se actualizó correctamente."
            );
        } catch (err) {
            setErrorContrasena(obtenerError(err));
        } finally {
            setGuardandoContrasena(false);
        }
    };

    const nombreMostrar =
        cuenta?.nombreCompleto ||
        lector?.nombreCompleto ||
        cuenta?.nombreUsuario ||
        "Mi cuenta";

    const correoMostrar =
        cuenta?.correo ||
        lector?.correo ||
        "";

    return (
        <div className="min-h-screen bg-[#F8F6F1]">
            <Navbar />

            <main className="mx-auto max-w-5xl px-5 py-10">
                {/* ENCABEZADO */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#3D7669]">
                            Mi perfil
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-slate-800">
                            Mi cuenta
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Consulta tus datos y administra la seguridad
                            de tu cuenta de BiblioNova.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cargarPerfil}
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

                {cargando && (
                    <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-white p-10 text-slate-500">
                        <RefreshCw
                            size={20}
                            className="animate-spin"
                        />
                        Cargando tu información...
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mt-8 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {!cargando && cuenta && (
                    <>
                        {/* INFORMACIÓN DE LA CUENTA */}
                        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
                            <div className="flex flex-wrap items-center gap-5">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E8F3ED] text-[#3D7669]">
                                    <UserRound size={38} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {nombreMostrar}
                                    </h2>

                                    <p className="mt-1 break-words text-sm text-slate-500">
                                        {correoMostrar || "Correo no disponible"}
                                    </p>

                                    {cuenta.rol && (
                                        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#3D7669]">
                      <ShieldCheck size={14} />
                                            {cuenta.rol}
                    </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <CampoInformacion
                                    icono={UserRound}
                                    etiqueta="Nombre de usuario"
                                    valor={cuenta.nombreUsuario}
                                />

                                <CampoInformacion
                                    icono={Mail}
                                    etiqueta="Correo electrónico"
                                    valor={correoMostrar}
                                />

                                <CampoInformacion
                                    icono={UserRound}
                                    etiqueta="Nombre completo"
                                    valor={nombreMostrar}
                                />

                                <CampoInformacion
                                    icono={ShieldCheck}
                                    etiqueta="Rol"
                                    valor={cuenta.rol}
                                />
                            </div>
                        </section>

                        {/* DATOS DEL LECTOR */}
                        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                                    <BookOpen size={23} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        Mis datos de lector
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Información registrada en la biblioteca.
                                    </p>
                                </div>
                            </div>

                            {avisoLector && (
                                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                                    {avisoLector}
                                </p>
                            )}

                            {lector && (
                                <>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                        <CampoInformacion
                                            icono={IdCard}
                                            etiqueta="Documento"
                                            valor={lector.documento}
                                        />

                                        <CampoInformacion
                                            icono={Phone}
                                            etiqueta="Teléfono"
                                            valor={lector.telefono}
                                        />

                                        <CampoInformacion
                                            icono={MapPin}
                                            etiqueta="Dirección"
                                            valor={lector.direccion}
                                        />

                                        <CampoInformacion
                                            icono={CalendarDays}
                                            etiqueta="Fecha de registro"
                                            valor={formatearFecha(
                                                lector.fechaRegistro
                                            )}
                                        />
                                    </div>

                                    <p className="mt-5 text-sm text-slate-500">
                                        Estado del lector:{" "}
                                        <span
                                            className={
                                                lector.activo
                                                    ? "font-semibold text-emerald-700"
                                                    : "font-semibold text-red-700"
                                            }
                                        >
                      {lector.activo ? "Activo" : "Inactivo"}
                    </span>
                                    </p>
                                </>
                            )}
                        </section>

                        {/* ACCESOS */}
                        <section className="mt-8">
                            <h2 className="text-xl font-bold text-slate-800">
                                Mis operaciones
                            </h2>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Link
                                    to="/mis-pedidos"
                                    className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md"
                                >
                                    <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                                        <ShoppingBag size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">
                                            Mis pedidos
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Consulta tus compras.
                                        </p>
                                    </div>

                                    <ChevronRight
                                        size={20}
                                        className="text-slate-400"
                                    />
                                </Link>

                                <Link
                                    to="/mis-prestamos"
                                    className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md"
                                >
                                    <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                                        <Bookmark size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">
                                            Préstamos y reservas
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Consulta tu biblioteca.
                                        </p>
                                    </div>

                                    <ChevronRight
                                        size={20}
                                        className="text-slate-400"
                                    />
                                </Link>
                            </div>
                        </section>

                        {/* DIRECCIONES DEL CLIENTE */}
                        <MisDirecciones />

                        {/* CAMBIAR CONTRASEÑA */}
                        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                                    <KeyRound size={24} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        Seguridad de la cuenta
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Cambia tu contraseña de acceso.
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={guardarContrasena}
                                className="mt-6 max-w-xl space-y-5"
                            >
                                <label className="block text-sm font-semibold text-slate-700">
                                    Contraseña actual *
                                    <input
                                        type={mostrarContrasenas ? "text" : "password"}
                                        required
                                        autoComplete="current-password"
                                        value={formulario.contrasenaActual}
                                        onChange={(e) =>
                                            actualizarContrasena(
                                                "contrasenaActual",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ingresa tu contraseña actual"
                                        className="mt-2 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-slate-700">
                                    Nueva contraseña *
                                    <input
                                        type={mostrarContrasenas ? "text" : "password"}
                                        required
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        value={formulario.contrasenaNueva}
                                        onChange={(e) =>
                                            actualizarContrasena(
                                                "contrasenaNueva",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Mínimo 8 caracteres"
                                        className="mt-2 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-slate-700">
                                    Confirmar nueva contraseña *
                                    <input
                                        type={mostrarContrasenas ? "text" : "password"}
                                        required
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        value={formulario.confirmarContrasena}
                                        onChange={(e) =>
                                            actualizarContrasena(
                                                "confirmarContrasena",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Repite tu nueva contraseña"
                                        className="mt-2 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-[#3D7669]"
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarContrasenas((valor) => !valor)
                                    }
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
                                >
                                    {mostrarContrasenas ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}

                                    {mostrarContrasenas
                                        ? "Ocultar contraseñas"
                                        : "Mostrar contraseñas"}
                                </button>

                                {errorContrasena && (
                                    <p
                                        role="alert"
                                        className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                    >
                                        <AlertCircle size={18} className="shrink-0" />
                                        {errorContrasena}
                                    </p>
                                )}

                                {mensajeContrasena && (
                                    <p
                                        role="status"
                                        className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                                    >
                                        <CheckCircle2 size={18} className="shrink-0" />
                                        {mensajeContrasena}
                                    </p>
                                )}

                                <div className="border-t border-stone-100 pt-5">
                                    <button
                                        type="submit"
                                        disabled={guardandoContrasena}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white hover:bg-[#315e55] disabled:opacity-50"
                                    >
                                        {guardandoContrasena ? (
                                            <RefreshCw
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <LockKeyhole size={18} />
                                        )}

                                        {guardandoContrasena
                                            ? "Actualizando..."
                                            : "Actualizar contraseña"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}