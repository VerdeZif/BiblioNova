
import { NavLink, Outlet } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  LibraryBig,
  Package,
  Users,
  Boxes,
  ArrowLeft,
} from "lucide-react";

export default function AdminLayout() {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-[#3D7669] text-white"
        : "text-slate-600 hover:bg-stone-100"
    }`;

  return (
    <div className="min-h-screen bg-[#F8F6F1] md:flex">
      <aside className="border-b border-stone-200 bg-white p-5 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-[#3D7669] p-2 text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">
              BiblioNova
            </h1>
            <p className="text-xs text-slate-500">
              Administración
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>

          <NavLink to="/admin/libros" className={navClass}>
            <LibraryBig size={19} />
            Libros
          </NavLink>

          <NavLink to="/admin/pedidos" className={navClass}>
            <Package size={19} />
            Pedidos
          </NavLink>

          <NavLink to="/admin/inventario" className={navClass}>
            <Boxes size={19} />
            Inventario
          </NavLink>

          <NavLink to="/admin/usuarios" className={navClass}>
            <Users size={19} />
            Usuarios
          </NavLink>

          <div className="border-t border-stone-200 pt-4">
            <NavLink to="/" className={navClass}>
              <ArrowLeft size={19} />
              Volver al inicio
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
