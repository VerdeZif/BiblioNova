const KEY = "biblionova_usuarios_demo";
const INICIALES = [
  { id: 1, nombre: "Administrador Demo", usuario: "admin", correo: "admin@biblionova.demo", rol: "admin", estado: "Activo" },
  { id: 2, nombre: "Bibliotecario Demo", usuario: "bibliotecario", correo: "bibliotecario@biblionova.demo", rol: "bibliotecario", estado: "Activo" },
  { id: 3, nombre: "Cliente Demo", usuario: "cliente", correo: "cliente@biblionova.demo", rol: "cliente", estado: "Activo" },
];
export function obtenerUsuariosDemo() {
  try {
    const data = localStorage.getItem(KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* Recuperar datos de demostración */ }
  localStorage.setItem(KEY, JSON.stringify(INICIALES));
  return INICIALES;
}
export function guardarUsuarioDemo(datos) {
  const usuarios = obtenerUsuariosDemo();
  const nombre = String(datos.nombre || "").trim();
  const usuario = String(datos.usuario || "").trim().toLowerCase();
  const correo = String(datos.correo || "").trim().toLowerCase();
  if (!nombre || !usuario || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error("Completa el nombre, usuario y correo válido.");
  if (usuarios.some(u => u.usuario === usuario && String(u.id) !== String(datos.id))) throw new Error("El usuario ya existe.");
  if (usuarios.some(u => u.correo === correo && String(u.id) !== String(datos.id))) throw new Error("El correo ya existe.");
  const rol = ["admin", "bibliotecario", "cliente"].includes(datos.rol) ? datos.rol : "cliente";
  const estado = datos.estado === "Inactivo" ? "Inactivo" : "Activo";
  const id = datos.id || crypto.randomUUID();
  const registro = { id, nombre, usuario, correo, rol, estado };
  localStorage.setItem(KEY, JSON.stringify(usuarios.some(u => String(u.id) === String(id)) ? usuarios.map(u => String(u.id) === String(id) ? registro : u) : [...usuarios, registro]));
  return registro;
}
export function eliminarUsuarioDemo(id) {
  const usuarios = obtenerUsuariosDemo();
  localStorage.setItem(KEY, JSON.stringify(usuarios.filter(u => String(u.id) !== String(id))));
}
export function iniciarSesionDemo(usuario, password) {
  if (password !== "demo1234") throw new Error("Contraseña de demostración incorrecta.");
  const cuenta = obtenerUsuariosDemo().find(u => u.usuario === String(usuario).trim().toLowerCase() && u.estado === "Activo");
  if (!cuenta) throw new Error("Usuario no encontrado o inactivo.");
  const sesion = { id: cuenta.id, nombre: cuenta.nombre, usuario: cuenta.usuario, rol: cuenta.rol };
  sessionStorage.setItem("biblionova_usuario", JSON.stringify(sesion));
  return { usuario: sesion };
}
export function obtenerSesionDemo() {
  try { return JSON.parse(sessionStorage.getItem("biblionova_usuario") || "null"); } catch { return null; }
}
export function cerrarSesionDemo() { sessionStorage.removeItem("biblionova_usuario"); }
