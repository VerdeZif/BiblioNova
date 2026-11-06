
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ClipboardList,
  BookmarkCheck,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

function obtenerTotal(respuesta) {
  const datos = respuesta.data;

  if (
      datos?.totalElementos != null &&
      Number.isFinite(Number(datos.totalElementos))
  ) {
    return Number(datos.totalElementos);
  }

  if (Array.isArray(datos)) {
    return datos.length;
  }

  return null;
}

function obtenerError(error) {
  return (
      error?.response?.data?.mensaje ||
      error?.message ||
      "No se pudieron consultar los registros."
  );
}

export default function BibliotecarioDashboard() {
  const [datos, setDatos] = useState({
    prestamos: null,
    reservas: null,
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [actualizacion, setActualizacion] = useState(0);

  const cargarDatos = useCallback(async (estaMontado) => {
    if (!estaMontado()) return;

    setCargando(true);

    const resultados = await Promise.allSettled([
      api.get("/prestamos", {
        params: { page: 0, size: 1 },
      }),
      api.get("/reservas", {
        params: { page: 0, size: 1 },
      }),
    ]);

    if (!estaMontado()) return;

    const nuevosDatos = {};
    const nuevosErrores = {};
    const claves = ["prestamos", "reservas"];

    resultados.forEach((resultado, indice) => {
      const clave = claves[indice];

      if (resultado.status === "fulfilled") {
        const total = obtenerTotal(resultado.value);

        nuevosDatos[clave] = total;

        if (total === null) {
          nuevosErrores[clave] =
              "La API no devolvió un total verificable.";
        }
      } else {
        nuevosDatos[clave] = null;
        nuevosErrores[clave] = obtenerError(resultado.reason);
      }
    });

    setDatos(nuevosDatos);
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

  const tarjetas = [
    {
      titulo: "Préstamos registrados",
      valor: datos.prestamos,
      clave: "prestamos",
      icono: ClipboardList,
      ruta: "/bibliotecario/prestamos",
    },
    {
      titulo: "Reservas registradas",
      valor: datos.reservas,
      clave: "reservas",
      icono: BookmarkCheck,
      ruta: "/bibliotecario/reservas",
    },
  ];

  return (
      <main className="mx-auto max-w-6xl p-6 md:p-10">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#3D7669]">
              Panel del bibliotecario
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Resumen general
            </h1>

            <p className="mt-2 text-slate-500">
              Consulta los préstamos y reservas registrados
              en BiblioNova.
            </p>
          </div>

          <button
              type="button"
              disabled={cargando}
              onClick={() =>
                  setActualizacion((anterior) => anterior + 1)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw
                size={18}
                className={cargando ? "animate-spin" : ""}
            />
            Actualizar
          </button>
        </div>

        {/* TARJETAS */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          {tarjetas.map(
              ({ titulo, valor, clave, icono: Icon, ruta }) => (
                  <Link
                      key={clave}
                      to={ruta}
                      className="group rounded-2xl border border-stone-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {titulo}
                      </p>

                      <Icon size={24} className="text-[#3D7669]" />
                    </div>

                    <p className="mt-5 text-4xl font-bold text-slate-800">
                      {cargando
                          ? "..."
                          : valor == null
                              ? "—"
                              : valor.toLocaleString("es-PE")}
                    </p>

                    {errores[clave] ? (
                        <p
                            role="alert"
                            className="mt-3 flex items-start gap-2 text-xs text-red-600"
                        >
                          <AlertCircle size={15} className="shrink-0" />
                          {errores[clave]}
                        </p>
                    ) : (
                        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#3D7669]">
                          Ver registros
                          <ArrowRight
                              size={15}
                              className="transition group-hover:translate-x-1"
                          />
                        </p>
                    )}
                  </Link>
              )
          )}
        </section>

        {/* ACCESOS RÁPIDOS */}
        <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-[#3D7669]" />

            <h2 className="text-xl font-bold text-slate-800">
              Gestión de biblioteca
            </h2>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Administra los préstamos, registra devoluciones
            y consulta las reservas realizadas por los lectores.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
                to="/bibliotecario/prestamos"
                className="rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-semibold text-white hover:bg-[#315e55]"
            >
              Gestionar préstamos
            </Link>

            <Link
                to="/bibliotecario/reservas"
                className="rounded-xl border border-[#3D7669] px-5 py-3 text-sm font-semibold text-[#3D7669] hover:bg-emerald-50"
            >
              Gestionar reservas
            </Link>
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-400">
          Información consultada desde Spring Boot.
          Los totales corresponden a los registros
          disponibles en cada endpoint.
        </p>
      </main>
  );
}
