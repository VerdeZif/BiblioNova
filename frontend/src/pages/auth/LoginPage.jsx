
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      setMessage("Completa todos los campos.");
      return;
    }

    setMessage(
      "Formulario validado. El inicio de sesión estará disponible cuando conectemos Spring Boot."
    );
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa tus datos para acceder a tu cuenta."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Correo electrónico
          </label>

          <div className="relative">
            <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
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
          className="w-full rounded-xl bg-[#3D7669] py-3.5 font-semibold text-white transition hover:bg-[#315e55]"
        >
            <div className="flex justify-end">
  <Link
    to="/recuperar-contrasena"
    className="text-sm font-medium text-[#3D7669] hover:underline"
  >
    ¿Olvidaste tu contraseña?
  </Link>
</div>
          Iniciar sesión
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
