import { NavLink, Outlet } from "react-router-dom";

import {
    BookOpen,
    LayoutDashboard,
    ShoppingBag,
    ClipboardList,
    CirclePlus,
    ArrowLeft,
} from "lucide-react";

export default function VendedorLayout() {
    const navClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
            isActive
                ? "bg-[#3D7669] text-white"
                : "text-slate-600 hover:bg-stone-100"
        }`;

    return (
        <div className="min-h-screen bg-[#F8F6F1] md:flex">
            <aside
                className="
          border-b border-stone-200 bg-white p-5
          md:sticky md:top-0 md:h-screen md:w-64
          md:shrink-0 md:self-start md:overflow-y-auto
          md:border-b-0 md:border-r
        "
            >
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-xl bg-[#3D7669] p-2 text-white">
                        <BookOpen size={24} />
                    </div>

                    <div>
                        <h1 className="font-bold text-slate-800">
                            BiblioNova
                        </h1>

                        <p className="text-xs text-slate-500">
                            Panel del vendedor
                        </p>
                    </div>
                </div>

                <nav className="space-y-2">
                    <NavLink
                        to="/vendedor"
                        end
                        className={navClass}
                    >
                        <LayoutDashboard size={19} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/vendedor/ventas"
                        className={navClass}
                    >
                        <ShoppingBag size={19} />
                        Consultar ventas
                    </NavLink>

                    <NavLink
                        to="/vendedor/pedidos"
                        className={navClass}
                    >
                        <ClipboardList size={19} />
                        Gestionar pedidos
                    </NavLink>

                    <NavLink
                        to="/vendedor/nueva-venta"
                        className={navClass}
                    >
                        <CirclePlus size={19} />
                        Registrar venta
                    </NavLink>

                    <div className="border-t border-stone-200 pt-4">
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

            <div className="min-w-0 flex-1">
                <Outlet />
            </div>
        </div>
    );
}