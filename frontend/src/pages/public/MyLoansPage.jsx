
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { obtenerPrestamosDemo } from "../../services/prestamosDemo";

export default function MyLoansPage() {
  const prestamos = obtenerPrestamosDemo();

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Mis préstamos
        </h1>

        <p className="mt-2 text-slate-500">
          Consulta tus solicitudes de préstamo.
        </p>

        {prestamos.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <BookOpen
              size={48}
              className="mx-auto text-stone-300"
            />

            <h2 className="mt-4 text-xl font-bold">
              Todavía no tienes préstamos
            </h2>

            <Link
              to="/catalogo"
              className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
            >
              Explorar libros
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {prestamos.map((prestamo) => (
              <article
                key={prestamo.id}
                className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-5 shadow-sm"
              >
                <img
                  src={prestamo.imagen}
                  alt={prestamo.titulo}
                  className="h-28 w-20 rounded-lg object-contain"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-800">
                    {prestamo.titulo}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {prestamo.autor}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={16} />
                    Solicitado el{" "}
                    {new Date(prestamo.fechaSolicitud).toLocaleDateString("es-PE")}
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {prestamo.estado}
                </span>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
