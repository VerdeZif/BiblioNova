
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Package,
  Users,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import { obtenerLibros } from "../../services/catalogo";
import { obtenerPedidosDemo } from "../../services/pedidosDemo";
import { obtenerPrestamosDemo } from "../../services/prestamosDemo";

export default function AdminDashboard() {
  const [totalLibros, setTotalLibros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pedidos] = useState(() => obtenerPedidosDemo());
  const [prestamos] = useState(() => obtenerPrestamosDemo());

  useEffect(() => {
    let activo = true;

    obtenerLibros()
      .then((libros) => {
        if (activo) setTotalLibros(libros.length);
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || "Error al cargar libros");
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const pendientes = prestamos.filter(
    (p) => p.estado === "Pendiente"
  ).length;

  const tarjetas = [
    {
      titulo: "Libros del catálogo",
      valor: loading ? "..." : error ? "—" : totalLibros,
      icono: BookOpen,
    },
    {
      titulo: "Pedidos registrados",
      valor: pedidos.length,
      icono: Package,
    },
    {
      titulo: "Solicitudes pendientes",
      valor: pendientes,
      icono: ClipboardList,
    },
    {
      titulo: "Usuarios registrados",
      valor: "—",
      icono: Users,
    },
  ];

  const accesos = [
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

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div>
        <p className="text-sm font-semibold text-[#3D7669]">
          Administración de BiblioNova
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Dashboard general
        </h1>

        <p className="mt-2 text-slate-500">
          Resumen de las operaciones de la biblioteca.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-600">
          No se pudo cargar el catálogo: {error}
        </p>
      )}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-800">
          Accesos rápidos
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {accesos.map((acceso) => (
            <Link
              key={acceso.ruta}
              to={acceso.ruta}
              className="group rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
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
        Panel de demostración. Los pedidos y préstamos
        se consultan desde el almacenamiento local.
        La gestión de usuarios todavía no está conectada.
      </p>
    </main>
  );
}
