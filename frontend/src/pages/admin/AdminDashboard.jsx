import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Package,
  ClipboardList,
  ArrowRight,
  ShoppingBag,
  Clock3,
  RefreshCw,
  AlertCircle,
  Users,
} from "lucide-react";

import api from "../../services/api";
import { obtenerLibros } from "../../services/catalogo";

const TARJETAS = [
  {
    clave: "libros",
    titulo: "Libros del catálogo",
    descripcion: "Registros consultados",
    icono: BookOpen,
    ruta: "/admin/libros",
  },
  {
    clave: "pedidos",
    titulo: "Pedidos registrados",
    descripcion: "Total de pedidos",
    icono: Package,
    ruta: "/admin/pedidos",
  },
  {
    clave: "pendientes",
    titulo: "Pedidos pendientes",
    descripcion: "Pendientes de confirmación",
    icono: Clock3,
    ruta: "/admin/pedidos",
  },
  {
    clave: "prestamos",
    titulo: "Préstamos registrados",
    descripcion: "Total de préstamos",
    icono: ClipboardList,
    ruta: "/bibliotecario/prestamos",
  },
  {
    clave: "ventas",
    titulo: "Ventas registradas",
    descripcion: "Total de ventas",
    icono: ShoppingBag,
    ruta: "/admin/ventas",
  },
  {
    clave: "usuarios",
    titulo: "Usuarios registrados",
    descripcion: "Total de cuentas del sistema",
    icono: Users,
    ruta: "/admin/usuarios",
  },
];

const ACCESOS = [
  {
    titulo: "Gestionar libros",
    descripcion: "Administrar el catálogo de libros.",
    ruta: "/admin/libros",
  },
  {
    titulo: "Gestionar pedidos",
    descripcion: "Consultar y gestionar las compras.",
    ruta: "/admin/pedidos",
  },
  {
    titulo: "Inventario",
    descripcion: "Supervisar existencias disponibles.",
    ruta: "/admin/inventario",
  },
  {
    titulo: "Usuarios",
    descripcion: "Administrar cuentas y permisos.",
    ruta: "/admin/usuarios",
  },
];

function extraerConteo(respuesta) {
  const datos = respuesta?.data ?? respuesta;

  if (
      datos?.totalElementos != null &&
      Number.isFinite(Number(datos.totalElementos))
  ) {
    return Number(datos.totalElementos);
  }

  // Compatibilidad con APIs que devuelven listas completas.
  if (Array.isArray(datos)) {
    return datos.length;
  }

  // Si solo recibimos una página sin total, no inventamos
  // una cifra global a partir de los registros de esa página.
  return null;
}

function mensajeError(error) {
  return (
      error?.response?.data?.mensaje ||
      error?.response?.data?.message ||
      error?.message ||
      "No se pudo consultar este indicador."
  );
}

const CONSULTAS = {
  libros: () => obtenerLibros(),

  pedidos: () =>
      api.get("/pedidos", {
        params: { page: 0, size: 1 },
      }),

  pendientes: () =>
      api.get("/pedidos", {
        params: {
          estado: "Pendiente",
          page: 0,
          size: 1,
        },
      }),

  prestamos: () =>
      api.get("/prestamos", {
        params: { page: 0, size: 1 },
      }),

  ventas: () =>
      api.get("/ventas", {
        params: { page: 0, size: 1 },
      }),

  usuarios: () =>
      api.get("/seguridad/usuarios", {
        params: { page: 0, size: 1 },
      }),
};

export default function AdminDashboard() {
  const [indicadores, setIndicadores] = useState({});
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [actualizacion, setActualizacion] = useState(0);

  const cargarDatos = useCallback(async (activo) => {
    setCargando(true);
    setErrores({});

    const claves = Object.keys(CONSULTAS);

    const resultados = await Promise.allSettled(
        claves.map((clave) => CONSULTAS[clave]())
    );

    if (!activo()) return;

    const nuevosIndicadores = {};
    const nuevosErrores = {};

    resultados.forEach((resultado, indice) => {
      const clave = claves[indice];

      if (resultado.status === "fulfilled") {
        const total = extraerConteo(resultado.value);

        if (total === null) {
          nuevosIndicadores[clave] = null;
          nuevosErrores[clave] =
              "La respuesta no incluye un total verificable.";
        } else {
          nuevosIndicadores[clave] = total;
        }
      } else {
        nuevosIndicadores[clave] = null;
        nuevosErrores[clave] = mensajeError(resultado.reason);
      }
    });

    setIndicadores(nuevosIndicadores);
    setErrores(nuevosErrores);
    setCargando(false);
  }, []);

  useEffect(() => {
    let montado = true;

    cargarDatos(() => montado);

    return () => {
      montado = false;
    };
  }, [cargarDatos, actualizacion]);

  const cantidadErrores = Object.keys(errores).length;

  return (
      <main className="mx-auto max-w-7xl p-6 md:p-10">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#3D7669]">
              Administración de BiblioNova
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Dashboard general
            </h1>

            <p className="mt-2 text-slate-500">
              Resumen de operaciones consultadas desde Spring Boot.
            </p>
          </div>

          <button
              type="button"
              onClick={() => setActualizacion((valor) => valor + 1)}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw
                size={17}
                className={cargando ? "animate-spin" : ""}
            />
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {/* ADVERTENCIA */}
        {!cargando && cantidadErrores > 0 && (
            <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              <AlertCircle size={20} className="shrink-0" />

              <div>
                <p className="font-semibold">
                  Algunos indicadores no pudieron cargarse.
                </p>
                <p className="mt-1">
                  Revisa las tarjetas correspondientes. Los demás
                  datos siguen disponibles.
                </p>
              </div>
            </div>
        )}

        {/* INDICADORES */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TARJETAS.map(
              ({ clave, titulo, descripcion, icono: Icon, ruta }) => {
                const tieneError = Boolean(errores[clave]);
                const valor = indicadores[clave];

                return (
                    <Link
                        key={clave}
                        to={ruta}
                        className="group rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition hover:border-[#3D7669]/30 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {titulo}
                        </p>

                        <Icon size={23} className="text-[#3D7669]" />
                      </div>

                      <p className="mt-5 text-4xl font-bold text-slate-800">
                        {cargando
                            ? "..."
                            : tieneError || valor == null
                                ? "—"
                                : valor.toLocaleString("es-PE")}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p
                            className={`text-xs ${
                                tieneError
                                    ? "text-red-600"
                                    : "text-slate-500"
                            }`}
                        >
                          {tieneError
                              ? errores[clave]
                              : descripcion}
                        </p>

                        <ArrowRight
                            size={17}
                            className="shrink-0 text-[#3D7669] transition group-hover:translate-x-1"
                        />
                      </div>
                    </Link>
                );
              }
          )}
        </section>

        {/* ACCESOS RÁPIDOS */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">
            Accesos rápidos
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa directamente al módulo de administración.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {ACCESOS.map((acceso) => (
                <Link
                    key={acceso.ruta}
                    to={acceso.ruta}
                    className="group rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition hover:border-[#3D7669]/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">
                      {acceso.titulo}
                    </h3>

                    <ArrowRight
                        size={19}
                        className="text-[#3D7669] transition group-hover:translate-x-1"
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {acceso.descripcion}
                  </p>
                </Link>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-400">
          Los indicadores utilizan las respuestas de la API.
          Se actualizan al abrir el panel o presionar Actualizar.
        </p>
      </main>
  );
}