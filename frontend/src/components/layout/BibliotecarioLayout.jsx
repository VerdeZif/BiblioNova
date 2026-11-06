
import { NavLink, Outlet } from "react-router-dom";

import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  BookmarkCheck,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function BibliotecarioLayout() {
  const { usuario } = useAuth();

  const esAdministrador = usuario?.rol === "Administrador";

  const navClass = ({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
              ? "bg-[#3D7669] text-white"
              : "text-slate-600 hover:bg-stone-100"
      }`;

  return (
      <div className="min-h-screen bg-[#F8F6F1] md:flex">
        {/* MENÚ LATERAL */}
        <aside
            className="
          border-b border-stone-200 bg-white p-5
          md:sticky md:top-0 md:h-screen md:w-64
          md:shrink-0 md:self-start md:overflow-y-auto
          md:border-b-0 md:border-r
        "
        >
          {/* LOGO */}
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-[#3D7669] p-2 text-white">
              <BookOpen size={24} />
            </div>

            <div>
              <h1 className="font-bold text-slate-800">
                BiblioNova
              </h1>

              <p className="text-xs text-slate-500">
                {esAdministrador
                    ? "Administración · Biblioteca"
                    : "Bibliotecario"}
              </p>
            </div>
          </div>

          {/* NAVEGACIÓN */}
          <nav className="space-y-2">
            <NavLink
                to="/bibliotecario"
                end
                className={navClass}
            >
              <LayoutDashboard size={19} />
              Dashboard
            </NavLink>

            <NavLink
                to="/bibliotecario/prestamos"
                className={navClass}
            >
              <ClipboardList size={19} />
              Gestionar préstamos
            </NavLink>

            <NavLink
                to="/bibliotecario/reservas"
                className={navClass}
            >
              <BookmarkCheck size={19} />
              Gestionar reservas
            </NavLink>

            {/* ACCESO EXCLUSIVO PARA ADMINISTRADOR */}
            {esAdministrador && (
                <div className="mt-5 border-t border-stone-200 pt-5">
                  <p className="mb-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Administración
                  </p>

                  <NavLink
                      to="/admin"
                      className={navClass}
                  >
                    <ShieldCheck size={19} />
                    Volver al panel administrador
                  </NavLink>
                </div>
            )}

            {/* VOLVER AL INICIO */}
            <div className="mt-5 border-t border-stone-200 pt-4">
              <NavLink
                  to="/"
                  className={navClass}
              >
                <ArrowLeft size={19} />
                Volver al inicio
              </NavLink>
            </div>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
  );
}
