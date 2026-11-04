
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { iniciarSesion } from "../../services/api";
import { iniciarSesionDemo } from "../../services/usuariosDemo";
import { USE_MOCKS } from "../../services/catalogo";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    usuario: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.usuario.trim() || !form.password) {
      setMessage("Completa todos los campos.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const data = USE_MOCKS
        ? iniciarSesionDemo(form.usuario.trim(), form.password)
        : await iniciarSesion(form.usuario.trim(), form.password);
      const rol = data.usuario.rol?.toLowerCase();
      navigate(rol === "cliente" ? "/catalogo" : rol === "bibliotecario" ? "/bibliotecario" : "/admin", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.status === 401
          ? "Usuario o contraseña incorrectos."
          : error.response?.data?.mensaje || "No se pudo conectar con el servidor. Verifica que Spring Boot esté iniciado.");
      } else {
        setMessage(error.message || "No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa tus datos para acceder a tu cuenta."
    >
      {USE_MOCKS && <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Acceso de demostración:</strong> usuarios admin, bibliotecario o cliente. Contraseña para todos: <code>demo1234</code>. Sin autenticación real.</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-usuario" className="mb-2 block text-sm font-semibold text-slate-700">
            Nombre de usuario
          </label>

          <div className="relative">
            <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="login-usuario"
              name="usuario"
              type="text"
              autoComplete="username"
              required
              value={form.usuario}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              className="w-full rounded-full border border-stone-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-[#3D7669]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">
            Contraseña
          </label>

          <div className="relative">
            <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-full border border-stone-200 bg-white py-3.5 pl-12 pr-12 outline-none focus:border-[#3D7669]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        {message && (
          <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#3D7669] py-3.5 font-semibold text-white transition hover:bg-[#315e55] disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        ¿Todavía no tienes una cuenta?{" "}
        <Link to="/registro" className="font-semibold text-[#3D7669] hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </AuthLayout>
  );
}
