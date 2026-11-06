
import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { Loader2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { obtenerRutaPorRol } from "../utils/roles";

export default function ProtectedRoute({ roles, children }) {
    const { usuario, cargando } = useAuth();
    const location = useLocation();

    // Esperar mientras se verifica el token JWT.
    if (cargando) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F6F1]">
                <Loader2
                    size={34}
                    className="animate-spin text-[#3D7669]"
                />

                <p className="text-sm font-medium text-slate-600">
                    Verificando sesión...
                </p>
            </div>
        );
    }

    // Usuario sin sesión.
    if (!usuario) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // Usuario autenticado pero sin el rol requerido.
    if (
        Array.isArray(roles) &&
        !roles.includes(usuario.rol)
    ) {
        return (
            <Navigate
                to={obtenerRutaPorRol(usuario.rol)}
                replace
            />
        );
    }

    // Acceso permitido.
    return children ?? <Outlet />;
}
