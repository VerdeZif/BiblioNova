
import { NavLink, Outlet } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";

export default function BibliotecarioLayout() {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-[#3D7669] text-white"
        : "text-slate-600 hover:bg-stone-100"
    }`;

  return (
    <div className="min-h-screen bg-[#F8F6F1] md:flex">
      <aside className="border-b border-stone-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-[#3D7669] p-2 text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">
              BiblioNova
            </h1>
            <p className="text-xs text-slate-500">
              Bibliotecario
            </p>
          </div>
        </div>

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
            to="/"
            className={navClass}
          >
            <ArrowLeft size={19} />
            Volver al inicio
          </NavLink>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
