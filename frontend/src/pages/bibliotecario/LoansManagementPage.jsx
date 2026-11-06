import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  RefreshCw,
  RotateCcw,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

import {
  listarPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  registrarDevolucion,
  anularPrestamo,
} from "../../services/prestamos";

import { listarLectores } from "../../services/lectoresAdmin";
import { buscarEjemplaresPrestables } from "../../services/ejemplaresPrestamo";
import { useAuth } from "../../context/AuthContext";

const POR_PAGINA = 10;

function errorAPI(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return "El servidor rechazó la autenticación (401). Vuelve a iniciar sesión. Si continúa ocurriendo, revisaremos la seguridad del backend.";
  }

  if (status === 403) {
    return "Tu usuario no tiene permisos para esta operación (403).";
  }

  const mensaje =
      (typeof data === "string" && data.trim()) ||
      data?.mensaje ||
      data?.message ||
      error?.message;

  return mensaje || "Ocurrió un error inesperado.";
}

function fecha(valor) {
  if (!valor) return "Sin registro";

  const normalizada = /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? `${valor}T00:00:00`
      : valor;

  const fechaValor = new Date(normalizada);

  if (Number.isNaN(fechaValor.getTime())) {
    return String(valor);
  }

  return fechaValor.toLocaleDateString("es-PE");
}

function estadoClase(estado) {
  if (estado === "Activo") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (estado === "Anulado") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

const botonPrincipal =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-4 py-3 text-sm font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50";

const botonSecundario =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50";

const campo =
    "mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-[#3D7669]";

function Modal({ children, onClose, titulo, ancho = "max-w-xl" }) {
  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className={`max-h-[92vh] w-full ${ancho} overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-800">
              {titulo}
            </h2>

            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-2 hover:bg-stone-100"
            >
              <X size={20} />
            </button>
          </div>

          {children}
        </div>
      </div>
  );
}

export default function LoansManagementPage() {
  const { usuario } = useAuth();

  // Listado de préstamos.
  const [prestamos, setPrestamos] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [vencidos, setVencidos] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Mensajes.
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorModal, setErrorModal] = useState("");

  // Nuevo préstamo.
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  // Buscador de lectores.
  const [busquedaLector, setBusquedaLector] = useState("");
  const [lectores, setLectores] = useState([]);
  const [lectorSeleccionado, setLectorSeleccionado] = useState(null);
  const [cargandoLectores, setCargandoLectores] = useState(false);
  const [paginaLectores, setPaginaLectores] = useState(0);
  const [paginasLectores, setPaginasLectores] = useState(0);

  // Buscador de ejemplares.
  const [busquedaEjemplar, setBusquedaEjemplar] = useState("");
  const [ejemplares, setEjemplares] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [cargandoEjemplares, setCargandoEjemplares] = useState(false);
  const [paginaEjemplares, setPaginaEjemplares] = useState(0);
  const [paginasEjemplares, setPaginasEjemplares] = useState(0);

  // Detalle y devolución.
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [devolucionAbierta, setDevolucionAbierta] = useState(false);
  const [lineas, setLineas] = useState([]);
  const [observacionesDevolucion, setObservacionesDevolucion] =
      useState("");
  const [guardandoDevolucion, setGuardandoDevolucion] =
      useState(false);

  // Anulación.
  const [anular, setAnular] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);

  const cargarPrestamos = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await listarPrestamos({
        q: buscar.trim(),
        estado: estado || undefined,
        soloVencidos: vencidos || undefined,
        page: pagina,
        size: POR_PAGINA,
      });

      if (!Array.isArray(respuesta?.contenido)) {
        throw new Error("Respuesta de préstamos inválida.");
      }

      setPrestamos(respuesta.contenido);
      setTotal(Number(respuesta.totalElementos ?? 0));
      setTotalPaginas(Number(respuesta.totalPaginas ?? 0));
      setError("");
    } catch (err) {
      setPrestamos([]);
      setTotal(0);
      setTotalPaginas(0);
      setError(errorAPI(err));
    } finally {
      setCargando(false);
    }
  }, [buscar, estado, vencidos, pagina]);

  useEffect(() => {
    cargarPrestamos();
  }, [cargarPrestamos]);

  // Buscar lectores reales. Se usa el ID solo internamente.
  const cargarLectores = async (q = "", page = 0) => {
    try {
      setCargandoLectores(true);
      setErrorModal("");

      const respuesta = await listarLectores({
        q: q.trim(),
        page,
        size: POR_PAGINA,
      });

      const lista = respuesta?.contenido;

      if (!Array.isArray(lista)) {
        throw new Error("Respuesta de lectores inválida.");
      }

      setLectores(lista.filter((lector) => lector.activo === true));
      setPaginaLectores(page);
      setPaginasLectores(Number(respuesta.totalPaginas ?? 0));
    } catch (err) {
      setLectores([]);
      setErrorModal(errorAPI(err));
    } finally {
      setCargandoLectores(false);
    }
  };

  // Buscar ejemplares prestables y disponibles.
  const cargarEjemplares = async (q = "", page = 0) => {
    try {
      setCargandoEjemplares(true);
      setErrorModal("");

      const respuesta = await buscarEjemplaresPrestables({
        q: q.trim(),
        page,
        size: POR_PAGINA,
      });

      setEjemplares(
          respuesta.contenido.filter(
              (ejemplar) =>
                  ejemplar.estado === "Disponible" &&
                  ejemplar.esPrestamo === true
          )
      );

      setPaginaEjemplares(page);
      setPaginasEjemplares(Number(respuesta.totalPaginas ?? 0));
    } catch (err) {
      setEjemplares([]);
      setErrorModal(errorAPI(err));
    } finally {
      setCargandoEjemplares(false);
    }
  };

  const abrirNuevo = () => {
    setNuevoAbierto(true);
    setLectorSeleccionado(null);
    setSeleccionados([]);
    setObservaciones("");
    setBusquedaLector("");
    setBusquedaEjemplar("");
    setLectores([]);
    setEjemplares([]);
    setPaginaLectores(0);
    setPaginaEjemplares(0);
    setPaginasLectores(0);
    setPaginasEjemplares(0);
    setErrorModal("");
    setMensaje("");

    cargarLectores("", 0);
    cargarEjemplares("", 0);
  };

  const seleccionarEjemplar = (ejemplar) => {
    if (
        ejemplar.estado !== "Disponible" ||
        ejemplar.esPrestamo !== true
    ) {
      setErrorModal("Este ejemplar no está disponible para préstamo.");
      return;
    }

    setSeleccionados((actual) => {
      const existe = actual.some(
          (item) => item.ejemplarId === ejemplar.ejemplarId
      );

      return existe
          ? actual.filter((item) => item.ejemplarId !== ejemplar.ejemplarId)
          : [...actual, ejemplar];
    });
  };

  const guardarPrestamo = async (event) => {
    event.preventDefault();

    if (guardando) return;

    if (!lectorSeleccionado) {
      setErrorModal("Selecciona un lector.");
      return;
    }

    if (!lectorSeleccionado.activo) {
      setErrorModal("El lector seleccionado no está activo.");
      return;
    }

    if (!seleccionados.length) {
      setErrorModal("Selecciona al menos un ejemplar.");
      return;
    }

    try {
      setGuardando(true);
      setErrorModal("");

      const respuesta = await crearPrestamo({
        lectorId: lectorSeleccionado.lectorId,
        codigosEjemplar: seleccionados.map(
            (item) => item.codigoEjemplar
        ),
        observaciones,
      });

      setNuevoAbierto(false);
      setMensaje(
          `Préstamo ${respuesta.codigoPrestamo || ""} registrado correctamente.`
      );
      setPagina(0);
      await cargarPrestamos();
    } catch (err) {
      setErrorModal(errorAPI(err));
    } finally {
      setGuardando(false);
    }
  };

  const verDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      setError("");

      const respuesta = await obtenerPrestamoPorId(id);
      setDetalle(respuesta);
      return respuesta;
    } catch (err) {
      setError(errorAPI(err));
      return null;
    } finally {
      setCargandoDetalle(false);
    }
  };

  const prepararDevolucion = () => {
    if (!detalle || detalle.estado !== "Activo") return;

    // No permitir volver a registrar un ejemplar ya devuelto.
    const pendientes = (detalle.ejemplares || []).filter(
        (ejemplar) => !ejemplar.fechaDevolucion
    );

    if (!pendientes.length) {
      setError(
          "Este préstamo no tiene ejemplares pendientes de devolución."
      );
      return;
    }

    setLineas(
        pendientes.map((ejemplar) => ({
          codigoEjemplar: ejemplar.codigoEjemplar,
          libro: ejemplar.libro?.nombre || "Sin título",
          seleccionado: false,
          condicionRecibida: "",
          observaciones: "",
        }))
    );

    setObservacionesDevolucion("");
    setErrorModal("");
    setDevolucionAbierta(true);
  };

  const actualizarLinea = (indice, cambios) => {
    setLineas((actual) =>
        actual.map((linea, i) =>
            i === indice ? { ...linea, ...cambios } : linea
        )
    );
  };

  const guardarDevolucion = async (event) => {
    event.preventDefault();

    if (guardandoDevolucion) return;

    const elegidas = lineas.filter((linea) => linea.seleccionado);

    if (!elegidas.length) {
      setErrorModal("Selecciona al menos un ejemplar.");
      return;
    }

    if (elegidas.some((linea) => !linea.condicionRecibida.trim())) {
      setErrorModal(
          "Indica la condición recibida de cada ejemplar."
      );
      return;
    }

    try {
      setGuardandoDevolucion(true);
      setErrorModal("");

      const respuesta = await registrarDevolucion(
          detalle.prestamoId,
          {
            lineas: elegidas.map((linea) => ({
              codigoEjemplar: linea.codigoEjemplar,
              condicionRecibida: linea.condicionRecibida.trim(),
              observaciones: linea.observaciones.trim(),
            })),
            observaciones: observacionesDevolucion.trim(),
          }
      );

      setDevolucionAbierta(false);
      setMensaje(
          `Devolución ${respuesta.codigoDevolucion || ""} registrada correctamente.`
      );

      await verDetalle(detalle.prestamoId);
      await cargarPrestamos();
    } catch (err) {
      setErrorModal(errorAPI(err));
    } finally {
      setGuardandoDevolucion(false);
    }
  };

  const confirmarAnulacion = async (event) => {
    event.preventDefault();

    if (!anular || !motivo.trim() || anulando) return;

    try {
      setAnulando(true);
      setErrorModal("");

      await anularPrestamo(anular.prestamoId, motivo);

      setAnular(null);
      setDetalle(null);
      setMotivo("");
      setMensaje("Préstamo anulado correctamente.");
      await cargarPrestamos();
    } catch (err) {
      setErrorModal(errorAPI(err));
    } finally {
      setAnulando(false);
    }
  };

  return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <p className="text-sm font-semibold text-[#3D7669]">
                  Bibliotecario
                </p>

                {usuario?.rol === "Administrador" && (
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#3D7669] hover:bg-stone-50"
                    >
                      <ArrowLeft size={18} />
                      Volver al administrador
                    </Link>
                )}
              </div>

              <h1 className="text-3xl font-bold text-slate-800">
                Gestión de préstamos
              </h1>
              <p className="mt-2 text-slate-500">
                Registro, seguimiento, devoluciones y vencimientos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                  type="button"
                  onClick={cargarPrestamos}
                  disabled={cargando}
                  className={botonSecundario}
              >
                <RefreshCw
                    size={17}
                    className={cargando ? "animate-spin" : ""}
                />
                Actualizar
              </button>
              <button
                  type="button"
                  onClick={abrirNuevo}
                  className={botonPrincipal}
              >
                <Plus size={17} />
                Nuevo préstamo
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Préstamos encontrados", total],
              [
                "Activos en esta página",
                prestamos.filter((p) => p.estado === "Activo").length,
              ],
              [
                "Vencidos en esta página",
                prestamos.filter((p) => p.vencido).length,
              ],
            ].map(([titulo, valor]) => (
                <div
                    key={titulo}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{titulo}</p>
                  <p className="mt-2 text-3xl font-bold text-[#3D7669]">
                    {valor}
                  </p>
                </div>
            ))}
          </div>

          {error && (
              <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
          )}
          {mensaje && (
              <p
                  role="status"
                  className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                {mensaje}
              </p>
          )}

          <div className="mt-8 grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-3">
              <Search size={18} className="text-slate-400" />
              <input
                  type="search"
                  value={buscar}
                  onChange={(e) => {
                    setBuscar(e.target.value);
                    setPagina(0);
                  }}
                  placeholder="Buscar préstamo"
                  className="w-full py-3 text-sm outline-none"
              />
            </label>

            <input
                type="text"
                value={estado}
                maxLength={60}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPagina(0);
                }}
                placeholder="Estado exacto (ej. Activo)"
                aria-label="Filtrar por estado"
                className="rounded-xl border border-stone-200 p-3 text-sm outline-none"
            />

            <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm">
              <input
                  type="checkbox"
                  checked={vencidos}
                  onChange={(e) => {
                    setVencidos(e.target.checked);
                    setPagina(0);
                  }}
                  className="accent-[#3D7669]"
              />
              Solo vencidos
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {cargando && (
                <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
                  Cargando préstamos...
                </p>
            )}

            {!cargando && prestamos.length === 0 && (
                <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
                  No hay préstamos para mostrar.
                </p>
            )}

            {!cargando &&
                prestamos.map((prestamo) => (
                    <article
                        key={prestamo.prestamoId}
                        className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">
                            {prestamo.codigoPrestamo}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Lector: {prestamo.lector?.nombre || "Sin nombre"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                      <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoClase(
                              prestamo.estado
                          )}`}
                      >
                        {prestamo.estado}
                      </span>
                            {prestamo.vencido && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                          <AlertTriangle size={13} /> Vencido
                        </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-slate-500">
                            Préstamo: {fecha(prestamo.fechaPrestamo)}
                            {" · "}Vence: {fecha(prestamo.fechaVencimiento)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                              type="button"
                              disabled={cargandoDetalle}
                              onClick={() => verDetalle(prestamo.prestamoId)}
                              className={botonPrincipal}
                          >
                            <Eye size={16} />
                            Detalle
                          </button>
                          {prestamo.estado === "Activo" && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    setAnular(prestamo);
                                    setMotivo("");
                                    setErrorModal("");
                                  }}
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                              >
                                <Ban size={16} />
                                Anular
                              </button>
                          )}
                        </div>
                      </div>
                    </article>
                ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <button
                type="button"
                disabled={pagina === 0 || cargando}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                className={botonSecundario}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-slate-500">
            Página {pagina + 1} de {Math.max(1, totalPaginas)}
          </span>
            <button
                type="button"
                disabled={cargando || pagina + 1 >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
                className={botonSecundario}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </main>

        {/* NUEVO PRÉSTAMO */}
        {nuevoAbierto && (
            <Modal
                titulo="Registrar préstamo"
                ancho="max-w-3xl"
                onClose={() => {
                  if (!guardando) setNuevoAbierto(false);
                }}
            >
              <form onSubmit={guardarPrestamo} className="space-y-6">
                {/* LECTOR */}
                <section className="space-y-3">
                  <h3 className="font-bold text-slate-800">
                    1. Seleccionar lector
                  </h3>

                  <div className="flex gap-2">
                    <input
                        type="search"
                        value={busquedaLector}
                        onChange={(e) => setBusquedaLector(e.target.value)}
                        placeholder="Buscar por DNI, nombre o correo"
                        className={`${campo} min-w-0 flex-1`}
                    />

                    <button
                        type="button"
                        disabled={cargandoLectores}
                        onClick={() => cargarLectores(busquedaLector, 0)}
                        className={botonSecundario}
                    >
                      <Search size={17} />
                      Buscar
                    </button>
                  </div>

                  {lectorSeleccionado && (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4">
                        <div>
                          <p className="flex items-center gap-2 font-semibold text-emerald-800">
                            <CheckCircle2 size={17} />
                            {lectorSeleccionado.nombreCompleto}
                          </p>
                          <p className="mt-1 text-xs text-emerald-700">
                            DNI: {lectorSeleccionado.documento}
                          </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setLectorSeleccionado(null)}
                            aria-label="Quitar lector seleccionado"
                            className="p-2 text-emerald-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                  )}

                  <div className="max-h-44 space-y-2 overflow-y-auto">
                    {cargandoLectores && (
                        <p className="text-sm text-slate-500">
                          Buscando lectores...
                        </p>
                    )}

                    {!cargandoLectores &&
                        lectores.map((lector) => (
                            <button
                                key={lector.lectorId}
                                type="button"
                                onClick={() => setLectorSeleccionado(lector)}
                                className="flex w-full items-center justify-between rounded-xl border border-stone-200 p-3 text-left hover:border-[#3D7669]"
                            >
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          {lector.nombreCompleto ||
                              `${lector.nombres} ${lector.apellidos}`}
                        </span>
                        <span className="block text-xs text-slate-500">
                          DNI: {lector.documento}
                          {" · "}
                          {lector.correo}
                        </span>
                      </span>

                              {lectorSeleccionado?.lectorId ===
                              lector.lectorId ? (
                                  <CheckCircle2
                                      size={18}
                                      className="text-[#3D7669]"
                                  />
                              ) : (
                                  <Plus size={18} className="text-slate-400" />
                              )}
                            </button>
                        ))}

                    {!cargandoLectores && lectores.length === 0 && (
                        <p className="text-sm text-slate-500">
                          No hay lectores activos en esta página.
                        </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <button
                        type="button"
                        disabled={cargandoLectores || paginaLectores === 0}
                        onClick={() =>
                            cargarLectores(
                                busquedaLector,
                                paginaLectores - 1
                            )
                        }
                        className="disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <span>
                  Página {paginaLectores + 1} de{" "}
                      {Math.max(1, paginasLectores)}
                </span>
                    <button
                        type="button"
                        disabled={
                            cargandoLectores ||
                            paginaLectores + 1 >= paginasLectores
                        }
                        onClick={() =>
                            cargarLectores(
                                busquedaLector,
                                paginaLectores + 1
                            )
                        }
                        className="disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </section>

                <hr className="border-stone-200" />

                {/* EJEMPLARES */}
                <section className="space-y-3">
                  <h3 className="font-bold text-slate-800">
                    2. Seleccionar ejemplares disponibles
                  </h3>

                  <div className="flex gap-2">
                    <input
                        type="search"
                        value={busquedaEjemplar}
                        onChange={(e) => setBusquedaEjemplar(e.target.value)}
                        placeholder="Buscar por libro o código"
                        className={`${campo} min-w-0 flex-1`}
                    />

                    <button
                        type="button"
                        disabled={cargandoEjemplares}
                        onClick={() =>
                            cargarEjemplares(busquedaEjemplar, 0)
                        }
                        className={botonSecundario}
                    >
                      <Search size={17} />
                      Buscar
                    </button>
                  </div>

                  <div className="max-h-52 space-y-2 overflow-y-auto">
                    {cargandoEjemplares && (
                        <p className="text-sm text-slate-500">
                          Buscando ejemplares...
                        </p>
                    )}

                    {!cargandoEjemplares &&
                        ejemplares.map((ejemplar) => {
                          const elegido = seleccionados.some(
                              (item) =>
                                  item.ejemplarId === ejemplar.ejemplarId
                          );

                          return (
                              <button
                                  type="button"
                                  key={ejemplar.ejemplarId}
                                  onClick={() =>
                                      seleccionarEjemplar(ejemplar)
                                  }
                                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${
                                      elegido
                                          ? "border-[#3D7669] bg-emerald-50"
                                          : "border-stone-200 hover:border-[#3D7669]"
                                  }`}
                              >
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">
                            {ejemplar.libro?.nombre ||
                                "Libro sin título"}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {ejemplar.codigoEjemplar}
                            {" · "}
                            {ejemplar.ubicacion?.nombre ||
                                "Sin ubicación"}
                          </span>
                        </span>
                                {elegido ? (
                                    <CheckCircle2
                                        size={19}
                                        className="shrink-0 text-[#3D7669]"
                                    />
                                ) : (
                                    <Plus
                                        size={19}
                                        className="shrink-0 text-slate-400"
                                    />
                                )}
                              </button>
                          );
                        })}

                    {!cargandoEjemplares &&
                        ejemplares.length === 0 && (
                            <p className="text-sm text-slate-500">
                              No se encontraron ejemplares disponibles
                              para préstamo.
                            </p>
                        )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <button
                        type="button"
                        disabled={
                            cargandoEjemplares || paginaEjemplares === 0
                        }
                        onClick={() =>
                            cargarEjemplares(
                                busquedaEjemplar,
                                paginaEjemplares - 1
                            )
                        }
                        className="disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <span>
                  Página {paginaEjemplares + 1} de{" "}
                      {Math.max(1, paginasEjemplares)}
                </span>
                    <button
                        type="button"
                        disabled={
                            cargandoEjemplares ||
                            paginaEjemplares + 1 >= paginasEjemplares
                        }
                        onClick={() =>
                            cargarEjemplares(
                                busquedaEjemplar,
                                paginaEjemplares + 1
                            )
                        }
                        className="disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>

                  {seleccionados.length > 0 && (
                      <div className="rounded-xl bg-stone-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-slate-800">
                          Seleccionados ({seleccionados.length})
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {seleccionados.map((ejemplar) => (
                              <span
                                  key={ejemplar.ejemplarId}
                                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700"
                              >
                        {ejemplar.codigoEjemplar}
                                <button
                                    type="button"
                                    onClick={() =>
                                        seleccionarEjemplar(ejemplar)
                                    }
                                    aria-label={`Quitar ${ejemplar.codigoEjemplar}`}
                                >
                          <X size={14} />
                        </button>
                      </span>
                          ))}
                        </div>
                      </div>
                  )}
                </section>

                <label className="block text-sm font-medium text-slate-700">
                  Observaciones del préstamo
                  <textarea
                      rows={2}
                      maxLength={500}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className={campo}
                  />
                </label>

                {errorModal && (
                    <p
                        role="alert"
                        className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {errorModal}
                    </p>
                )}

                <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
                  <button
                      type="button"
                      disabled={guardando}
                      onClick={() => setNuevoAbierto(false)}
                      className={botonSecundario}
                  >
                    Cancelar
                  </button>

                  <button
                      type="submit"
                      disabled={
                          guardando ||
                          !lectorSeleccionado ||
                          seleccionados.length === 0
                      }
                      className={botonPrincipal}
                  >
                    {guardando ? "Registrando..." : "Registrar préstamo"}
                  </button>
                </div>
              </form>
            </Modal>
        )}

        {/* DETALLE */}
        {detalle && !devolucionAbierta && (
            <Modal
                titulo={`Préstamo ${detalle.codigoPrestamo || detalle.prestamoId}`}
                ancho="max-w-2xl"
                onClose={() => setDetalle(null)}
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Lector:{" "}
                  <strong>{detalle.lector?.nombre}</strong>
                </p>
                <p className="text-sm text-slate-600">
                  Estado:{" "}
                  <strong>{detalle.estado}</strong>
                  {" · "}
                  Vencimiento: {fecha(detalle.fechaVencimiento)}
                </p>
                <p className="text-sm text-slate-600">
                  Política: {detalle.politica || "No especificada"}
                </p>

                <h3 className="font-bold text-slate-800">
                  Ejemplares
                </h3>

                {(detalle.ejemplares || []).map((ejemplar) => (
                    <div
                        key={ejemplar.detallePrestamoId}
                        className="rounded-xl border border-stone-200 p-4"
                    >
                      <p className="font-semibold text-slate-800">
                        {ejemplar.libro?.nombre}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Código: {ejemplar.codigoEjemplar}
                        {" · "}Estado: {ejemplar.estado}
                      </p>
                      {ejemplar.fechaDevolucion && (
                          <p className="mt-1 text-sm text-slate-500">
                            Devuelto: {fecha(ejemplar.fechaDevolucion)}
                          </p>
                      )}
                    </div>
                ))}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                      {error}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                      type="button"
                      onClick={() => setDetalle(null)}
                      className={botonSecundario}
                  >
                    Cerrar
                  </button>

                  {detalle.estado === "Activo" && (
                      <button
                          type="button"
                          onClick={prepararDevolucion}
                          className={botonPrincipal}
                      >
                        <RotateCcw size={17} />
                        Registrar devolución
                      </button>
                  )}
                </div>
              </div>
            </Modal>
        )}

        {/* DEVOLUCIÓN */}
        {detalle && devolucionAbierta && (
            <Modal
                titulo={`Devolución · ${detalle.codigoPrestamo}`}
                ancho="max-w-2xl"
                onClose={() => {
                  if (!guardandoDevolucion) setDevolucionAbierta(false);
                }}
            >
              <form onSubmit={guardarDevolucion} className="space-y-4">
                <p className="text-sm text-slate-500">
                  Selecciona los ejemplares recibidos. Los que ya
                  fueron devueltos no aparecen aquí.
                </p>

                {lineas.map((linea, indice) => (
                    <div
                        key={linea.codigoEjemplar}
                        className="rounded-xl border border-stone-200 p-4"
                    >
                      <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={linea.seleccionado}
                            onChange={(e) =>
                                actualizarLinea(indice, {
                                  seleccionado: e.target.checked,
                                })
                            }
                            className="mt-1 accent-[#3D7669]"
                        />
                        <span className="text-sm">
                    <strong className="block">{linea.libro}</strong>
                    <span className="text-slate-500">
                      Código: {linea.codigoEjemplar}
                    </span>
                  </span>
                      </label>

                      {linea.seleccionado && (
                          <div className="mt-4 space-y-3">
                            <label className="block text-sm font-medium">
                              Condición recibida *

                              <select
                                  required
                                  value={linea.condicionRecibida}
                                  onChange={(e) =>
                                      actualizarLinea(indice, {
                                        condicionRecibida: e.target.value,
                                      })
                                  }
                                  className={campo}
                              >
                                <option value="">Selecciona la condición</option>
                                <option value="Bueno">Bueno</option>
                                <option value="Regular">Regular</option>
                                <option value="Danado">Dañado</option>
                                <option value="Perdido">Perdido</option>
                              </select>
                            </label>

                            <label className="block text-sm font-medium">
                              Observaciones del ejemplar
                              {["Danado", "Perdido"].includes(linea.condicionRecibida)
                                  ? " *"
                                  : ""}

                              <textarea
                                  rows={2}
                                  required={["Danado", "Perdido"].includes(
                                      linea.condicionRecibida
                                  )}
                                  maxLength={1000}
                                  value={linea.observaciones}
                                  onChange={(e) =>
                                      actualizarLinea(indice, {
                                        observaciones: e.target.value,
                                      })
                                  }
                                  placeholder="Describe el estado del ejemplar"
                                  className={campo}
                              />
                            </label>
                          </div>
                      )}
                    </div>
                ))}

                <label className="block text-sm font-medium">
                  Observaciones generales
                  <textarea
                      rows={3}
                      maxLength={500}
                      value={observacionesDevolucion}
                      onChange={(e) =>
                          setObservacionesDevolucion(e.target.value)
                      }
                      className={campo}
                  />
                </label>

                {errorModal && (
                    <p
                        role="alert"
                        className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {errorModal}
                    </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                      type="button"
                      disabled={guardandoDevolucion}
                      onClick={() => setDevolucionAbierta(false)}
                      className={botonSecundario}
                  >
                    Cancelar
                  </button>
                  <button
                      type="submit"
                      disabled={
                          guardandoDevolucion ||
                          !lineas.some((linea) => linea.seleccionado)
                      }
                      className={botonPrincipal}
                  >
                    {guardandoDevolucion
                        ? "Registrando..."
                        : "Confirmar devolución"}
                  </button>
                </div>
              </form>
            </Modal>
        )}

        {/* ANULACIÓN */}
        {anular && (
            <Modal
                titulo="Anular préstamo"
                onClose={() => {
                  if (!anulando) setAnular(null);
                }}
            >
              <form onSubmit={confirmarAnulacion} className="space-y-4">
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle size={18} className="mb-2" />
                  Vas a solicitar la anulación de{" "}
                  <strong>{anular.codigoPrestamo}</strong>.
                </div>

                <label className="block text-sm font-medium">
                  Motivo de anulación *
                  <textarea
                      required
                      rows={3}
                      maxLength={500}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className={campo}
                  />
                </label>

                {errorModal && (
                    <p role="alert" className="text-sm text-red-600">
                      {errorModal}
                    </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                      type="button"
                      disabled={anulando}
                      onClick={() => setAnular(null)}
                      className={botonSecundario}
                  >
                    Cancelar
                  </button>
                  <button
                      type="submit"
                      disabled={anulando || !motivo.trim()}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {anulando ? "Anulando..." : "Confirmar anulación"}
                  </button>
                </div>
              </form>
            </Modal>
        )}
      </div>
  );
}