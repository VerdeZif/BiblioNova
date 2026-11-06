
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const EVENTO_AUTH = "biblionova:auth-change";

const CLAVE_TOKEN = "biblionova_token";
const CLAVE_USUARIO = "biblionova_usuario";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ----------------------------------------------------
// SESIÓN
// ----------------------------------------------------

export function obtenerUsuarioGuardado() {
  try {
    const usuario = sessionStorage.getItem(CLAVE_USUARIO);

    return usuario ? JSON.parse(usuario) : null;
  } catch {
    return null;
  }
}

export function guardarUsuario(usuario) {
  if (!usuario) return;

  sessionStorage.setItem(
      CLAVE_USUARIO,
      JSON.stringify(usuario)
  );
}

function notificarCambioAuth() {
  window.dispatchEvent(new Event(EVENTO_AUTH));
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  sessionStorage.removeItem(CLAVE_USUARIO);

  notificarCambioAuth();
}

// ----------------------------------------------------
// INTERCEPTOR DE SOLICITUDES
// ----------------------------------------------------

api.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem(CLAVE_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
);

// ----------------------------------------------------
// INTERCEPTOR DE RESPUESTAS
// ----------------------------------------------------

api.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
      const estado = error.response?.status;

      const url = String(error.config?.url || "");

      const esLogin = url.includes("/auth/login");
      const esRegistro = url.includes("/auth/registro");

      const tokenActual = sessionStorage.getItem(CLAVE_TOKEN);

      // Solo cerramos la sesión cuando:
      // 1. Ya existía un token.
      // 2. El backend respondió 401.
      // 3. No estamos intentando iniciar sesión o registrarnos.
      if (
          estado === 401 &&
          tokenActual &&
          !esLogin &&
          !esRegistro
      ) {
        cerrarSesion();
      }

      // Un 403 significa falta de permisos, no necesariamente
      // que la sesión haya expirado.
      return Promise.reject(error);
    }
);

// ----------------------------------------------------
// AUTENTICACIÓN
// ----------------------------------------------------

export async function iniciarSesion(usuario, contrasena) {
  const respuesta = await api.post("/auth/login", {
    usuario,
    contrasena,
  });

  const datos = respuesta.data;

  if (!datos.token) {
    throw new Error(
        "El servidor no devolvió un token de autenticación."
    );
  }

  sessionStorage.setItem(CLAVE_TOKEN, datos.token);

  if (datos.usuario) {
    guardarUsuario(datos.usuario);
  } else {
    sessionStorage.removeItem(CLAVE_USUARIO);
  }

  notificarCambioAuth();

  return datos;
}

// ----------------------------------------------------
// REGISTRO DE CLIENTES
// ----------------------------------------------------

export async function registrarCliente(datos) {
  const respuesta = await api.post("/auth/registro", {
    nombreUsuario: datos.nombreUsuario,
    contrasena: datos.contrasena,
    correo: datos.correo,
    documento: datos.documento,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    telefono: datos.telefono,
    direccion: datos.direccion,
  });

  return respuesta.data;
}

// ----------------------------------------------------
// USUARIO AUTENTICADO
// ----------------------------------------------------

export async function obtenerMiUsuario() {
  const respuesta = await api.get("/auth/me");

  return respuesta.data;
}

export default api;
