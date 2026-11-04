
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { guardarUsuarioDemo } from "../../services/usuariosDemo";
import { USE_MOCKS } from "../../services/catalogo";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!form.acceptTerms) {
      setError("Debes aceptar los términos para continuar.");
      return;
    }

    if (USE_MOCKS) {
      try {
        const usuario = form.email.trim().toLowerCase();
        guardarUsuarioDemo({ nombre: `${form.firstName.trim()} ${form.lastName.trim()}`, usuario, correo: usuario, rol: "cliente", estado: "Activo" });
        setMessage("Cuenta de demostración creada. Para ingresar, usa tu correo como usuario y la contraseña demo1234. La contraseña escrita en este formulario no se guarda.");
      } catch (err) { setError(err.message || "No se pudo registrar el usuario."); }
    } else {
      setMessage("Datos validados correctamente. El registro real estará disponible al conectar el backend.");
    }
  };

 const inputClass =
  "w-full rounded-full border border-stone-200 bg-[#FAFAF9] px-5 py-3.5 outline-none transition focus:border-[#3D7669] focus:bg-white";
  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Únete a BiblioNova y comienza a descubrir nuevas lecturas."
    >
      {USE_MOCKS && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Modo demostración: el registro crea un usuario local, pero no almacena contraseñas. Todas las cuentas demo ingresan con <strong>demo1234</strong>. No uses contraseñas personales.</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-firstName" className="mb-2 block text-sm font-semibold text-slate-700">
              Nombres
            </label>
            <input
              id="register-firstName"
              name="firstName"
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Tus nombres"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="register-lastName" className="mb-2 block text-sm font-semibold text-slate-700">
              Apellidos
            </label>
            <input
              id="register-lastName"
              name="lastName"
              required
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Tus apellidos"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Correo electrónico
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-slate-700">
            Contraseña
          </label>

          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className={`${inputClass} pr-12`}
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

        <div>
          <label htmlFor="register-confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
            Confirmar contraseña
          </label>
          <input
            id="register-confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repite tu contraseña"
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={form.acceptTerms}
            onChange={handleChange}
            className="mt-1 h-4 w-4 accent-[#3D7669]"
          />
          <span>
            He leído y acepto los términos y condiciones de BiblioNova.
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-[#3D7669] py-3.5 font-semibold text-white transition hover:bg-[#315e55]"
        >
          Crear cuenta
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        ¿Ya tienes una cuenta?{" "}
        <Link to="/login" className="font-semibold text-[#3D7669] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
