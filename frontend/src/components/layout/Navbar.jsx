
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import { obtenerRutaPorRol } from "../../utils/roles";

import {
    Link,
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    BookOpen,
    Search,
    ShoppingBag,
    UserRound,
} from "lucide-react";

export default function Navbar() {
    const navigate = useNavigate();

    const { totalItems } = useCart();
    const { usuario, logout } = useAuth();

    const navClass = ({ isActive }) =>
        `transition-colors hover:text-emerald-700 ${
            isActive
                ? "text-emerald-700 font-semibold"
                : "text-slate-600"
        }`;

    const manejarCerrarSesion = () => {
        logout();
        navigate("/login");
    };

    // El cliente tiene una página personal independiente.
    // Los demás roles conservan sus paneles correspondientes.
    const obtenerRutaPanel = () => {
        if (!usuario) {
            return "/login";
        }

        if (usuario.rol === "Cliente") {
            return "/mi-cuenta";
        }

        return obtenerRutaPorRol(usuario.rol);
    };

    const rutaPanel = obtenerRutaPanel();

    return (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#F8F6F1]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">

                {/* LOGO */}
                <Link
                    to="/"
                    className="flex items-center gap-2"
                >
                    <div className="rounded-xl bg-[#3D7669] p-2 text-white">
                        <BookOpen size={23} />
                    </div>

                    <span className="text-xl font-bold tracking-tight text-slate-800">
            Biblio
            <span className="text-[#3D7669]">
              Nova
            </span>
          </span>
                </Link>

                {/* NAVEGACIÓN */}
                <nav className="hidden items-center gap-7 text-sm md:flex">
                    <NavLink
                        to="/"
                        end
                        className={navClass}
                    >
                        Inicio
                    </NavLink>

                    <NavLink
                        to="/catalogo"
                        className={navClass}
                    >
                        Catálogo
                    </NavLink>

                    {usuario?.rol === "Cliente" && (
                        <>
                            <NavLink
                                to="/mis-prestamos"
                                className={navClass}
                            >
                                Préstamos
                            </NavLink>

                            <NavLink
                                to="/mis-pedidos"
                                className={navClass}
                            >
                                Mis pedidos
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* ACCIONES */}
                <div className="flex items-center gap-3">

                    {/* BUSCAR */}
                    <Link
                        to="/catalogo"
                        aria-label="Buscar libros"
                        className="rounded-lg p-2 text-slate-600 hover:bg-stone-200"
                    >
                        <Search size={20} />
                    </Link>

                    {/* CARRITO */}
                    <Link
                        to="/carrito"
                        aria-label={`Carrito de compras, ${totalItems} productos`}
                        className="relative inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-stone-200"
                    >
                        <ShoppingBag size={22} />

                        {totalItems > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3D7669] px-1 text-[11px] font-bold text-white ring-2 ring-[#F8F6F1]">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
                        )}
                    </Link>

                    {/* CERRAR SESIÓN */}
                    {usuario && (
                        <button
                            type="button"
                            onClick={manejarCerrarSesion}
                            className="text-xs font-medium text-slate-600 hover:text-red-600"
                        >
                            Salir (
                            {usuario.usuario ||
                                usuario.nombre ||
                                usuario.nombreUsuario ||
                                "Usuario"}
                            )
                        </button>
                    )}

                    {/* MI PANEL */}
                    <Link
                        to={rutaPanel}
                        className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#315e55]"
                    >
                        <UserRound size={17} />

                        <span className="hidden sm:inline">
              {usuario ? "Mi panel" : "Ingresar"}
            </span>
                    </Link>

                </div>
            </div>
        </header>
    );
}
