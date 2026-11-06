
export const RUTAS_POR_ROL = {
    Administrador: "/admin",
    Bibliotecario: "/bibliotecario",
    Vendedor: "/vendedor",
    Cliente: "/mi-cuenta",
};

export function obtenerRutaPorRol(rol) {
    return RUTAS_POR_ROL[rol] || "/login";
}
