import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { registrarCliente } from "../../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombreUsuario: "",
    firstName: "",
    lastName: "",
    documento: "",
    email: "",
    telefono: "",
    direccion: "",
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

  const handleSubmit = async (event) => {
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

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await registrarCliente({
        nombreUsuario: form.nombreUsuario.trim(),
        contrasena: form.password,
        correo: form.email.trim(),
        documento: form.documento.trim(),
        nombres: form.firstName.trim(),
        apellidos: form.lastName.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
      });

      setMessage("¡Registro completado correctamente!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(
          error.response?.data?.mensaje ||
          "No se pudo completar el registro."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
      "w-full rounded-full border border-stone-200 bg-[#FAFAF9] px-5 py-3.5 outline-none transition focus:border-[#3D7669] focus:bg-white";

  return (
      <AuthLayout
          title="Crea tu cuenta"
          subtitle="Únete a BiblioNova y comienza a descubrir nuevas lecturas."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de usuario y Documento */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="register-nombreUsuario" className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre de usuario
              </label>
              <input
                  id="register-nombreUsuario"
                  name="nombreUsuario"
                  required
                  autoComplete="username"
                  value={form.nombreUsuario}
                  onChange={handleChange}
                  placeholder="Ej. juanperez"
                  className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="register-documento" className="mb-2 block text-sm font-semibold text-slate-700">
                Documento de identidad
              </label>
              <input
                  id="register-documento"
                  name="documento"
                  required
                  value={form.documento}
                  onChange={handleChange}
                  placeholder="DNI / CÉDULA"
                  className={inputClass}
              />
            </div>
          </div>

          {/* Nombres y Apellidos */}
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

          {/* Correo y Teléfono */}
          <div className="grid gap-4 sm:grid-cols-2">
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
              <label htmlFor="register-telefono" className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>
              <input
                  id="register-telefono"
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="987654321"
                  className={inputClass}
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="register-direccion" className="mb-2 block text-sm font-semibold text-slate-700">
              Dirección
            </label>
            <input
                id="register-direccion"
                name="direccion"
                required
                autoComplete="street-address"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Av. Principal 123, Lima"
                className={inputClass}
            />
          </div>

          {/* Contraseña */}
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

          {/* Confirmar Contraseña */}
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

          {/* Términos y condiciones */}
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
              disabled={loading}
              className="w-full rounded-xl bg-[#3D7669] py-3.5 font-semibold text-white transition hover:bg-[#315e55] disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
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