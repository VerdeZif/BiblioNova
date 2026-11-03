import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("biblionova_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function iniciarSesion(usuario, contrasena) {
  const { data } = await api.post("/auth/login", { usuario, contrasena });
  if (!data?.token || !data?.usuario) {
    throw new Error("La respuesta del servidor no contiene una sesión válida.");
  }
  sessionStorage.setItem("biblionova_token", data.token);
  sessionStorage.setItem("biblionova_usuario", JSON.stringify(data.usuario));
  return data;
}

export function cerrarSesion() {
  sessionStorage.removeItem("biblionova_token");
  sessionStorage.removeItem("biblionova_usuario");
}

export default api;
