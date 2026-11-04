
import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import {
  obtenerPrestamosDemo,
  cambiarEstadoPrestamoDemo,
} from "../../services/prestamosDemo";

export default function LoansManagementPage() {
  const [prestamos, setPrestamos] = useState(
    () => obtenerPrestamosDemo()
  );
  const [error, setError] = useState("");

  const cambiarEstado = (id, estado) => {
    try {
      setError("");
      const actualizados = cambiarEstadoPrestamoDemo(
        id,
        estado
      );
      setPrestamos(actualizados);
    } catch (err) {
      setError(err.message);
    }
  };

  const pendientes = prestamos.filter(
    (p) => p.estado === "Pendiente"
  ).length;

  const aprobados = prestamos.filter(
    (p) => p.estado === "Aprobado"
  ).length;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Gestión de préstamos
        </h1>

        <p className="mt-2 text-slate-500">
          Panel de demostración del bibliotecario.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total solicitudes", prestamos.length],
            ["Pendientes", pendientes],
            ["Aprobados", aprobados],
          ].map(([titulo, valor]) => (
            <div
              key={titulo}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {titulo}
              </p>
              <p className="mt-2 text-3xl font-bold text-[#3D7669]">
                {valor}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-6 text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {prestamos.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
              No hay solicitudes registradas.
            </div>
          )}

          {prestamos.map((prestamo) => (
            <article
              key={prestamo.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {prestamo.titulo}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {prestamo.autor}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#3D7669]">
                    Estado: {prestamo.estado}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {prestamo.estado === "Pendiente" && (
                    <>
                      <button
                        onClick={() =>
                          cambiarEstado(prestamo.id, "Aprobado")
                        }
                        className="flex items-center gap-2 rounded-lg bg-[#3D7669] px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Check size={16} />
                        Aprobar
                      </button>

                      <button
                        onClick={() =>
                          cambiarEstado(prestamo.id, "Rechazado")
                        }
                        className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                      >
                        <X size={16} />
                        Rechazar
                      </button>
                    </>
                  )}

                  {prestamo.estado === "Aprobado" && (
                    <button
                      onClick={() =>
                        cambiarEstado(prestamo.id, "Devuelto")
                      }
                      className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <RotateCcw size={16} />
                      Registrar devolución
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
