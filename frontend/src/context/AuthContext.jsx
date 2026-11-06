import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    iniciarSesion,
    cerrarSesion,
    obtenerMiUsuario,
    obtenerUsuarioGuardado,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() =>
        obtenerUsuarioGuardado()
    );

    const [cargando, setCargando] = useState(() =>
        Boolean(sessionStorage.getItem("biblionova_token"))
    );

    // Recuperar y validar la sesión al cargar la aplicación
    useEffect(() => {
        let activo = true;

        const sincronizarSesion = () => {
            if (!activo) return;

            setUsuario(obtenerUsuarioGuardado());
            setCargando(false);
        };

        window.addEventListener(
            "biblionova:auth-change",
            sincronizarSesion
        );

        async function verificarSesion() {
            const token = sessionStorage.getItem("biblionova_token");

            if (!token) {
                if (activo) {
                    setUsuario(null);
                    setCargando(false);
                }
                return;
            }

            try {
                const respuesta = await obtenerMiUsuario();

                const usuarioActual =
                    respuesta.usuario ?? respuesta;

                if (activo) {
                    setUsuario(usuarioActual);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    cerrarSesion();

                    if (activo) {
                        setUsuario(null);
                    }
                } else {
                    // Si hay un problema temporal de conexión,
                    // conservamos los datos guardados de la sesión.
                    if (activo) {
                        setUsuario(obtenerUsuarioGuardado());
                    }
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        verificarSesion();

        return () => {
            activo = false;

            window.removeEventListener(
                "biblionova:auth-change",
                sincronizarSesion
            );
        };
    }, []);

    // Iniciar sesión desde cualquier componente
    const login = async (nombreUsuario, contrasena) => {
        const respuesta = await iniciarSesion(
            nombreUsuario,
            contrasena
        );

        const usuarioActual = respuesta.usuario;

        if (!usuarioActual) {
            throw new Error(
                "El servidor no devolvió los datos del usuario."
            );
        }

        setUsuario(usuarioActual);

        return respuesta;
    };

    // Cerrar sesión
    const logout = () => {
        cerrarSesion();
        setUsuario(null);
    };

    const valor = {
        usuario,
        cargando,
        autenticado: Boolean(usuario),
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para utilizar la autenticación
export function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider."
        );
    }

    return contexto;
}