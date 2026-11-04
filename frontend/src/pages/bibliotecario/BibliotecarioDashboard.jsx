
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { obtenerPrestamosDemo } from "../../services/prestamosDemo";

export default function BibliotecarioDashboard() {
  const prestamos = obtenerPrestamosDemo();

  const pendientes = prestamos.filter(
    (p) => p.estado === "Pendiente"
  ).length;

  const aprobados = prestamos.filter(
    (p) => p.estado === "Aprobado"
  ).length;

  const tarjetas = [
    {
      titulo: "Total solicitudes",
      valor: prestamos.length,
      icono: ClipboardList,
    },
    {
      titulo: "Pendientes",
      valor: pendientes,
      icono: Clock3,
    },
    {
      titulo: "Préstamos aprobados",
      valor: aprobados,
      icono: CheckCircle2,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <div>
        <p className="text-sm font-semibold text-[#3D7669]">
          Panel del bibliotecario
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Resumen general
        </h1>
        <p className="mt-2 text-slate-500">
          Supervisa las solicitudes y los préstamos de libros.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map(({ titulo, valor, icono: Icon }) => (
          <div
            key={titulo}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {titulo}
              </p>
              <Icon size={22} className="text-[#3D7669]" />
            </div>

            <p className="mt-5 text-4xl font-bold text-slate-800">
              {valor}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#3D7669]" />
          <h2 className="text-xl font-bold text-slate-800">
            Gestión de biblioteca
          </h2>
        </div>

        <p className="mt-3 text-slate-500">
          Revisa las solicitudes pendientes y registra
          las devoluciones de libros.
        </p>

        <Link
          to="/bibliotecario/prestamos"
          className="mt-5 inline-flex rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-semibold text-white hover:bg-[#315e55]"
        >
          Gestionar préstamos
        </Link>
      </section>

      <p className="mt-6 text-xs text-slate-400">
        Panel de demostración. Los datos se almacenan
        localmente en este navegador.
      </p>
    </main>
  );
}
