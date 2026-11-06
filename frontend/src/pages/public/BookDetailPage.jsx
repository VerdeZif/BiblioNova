
import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  Minus,
  Plus,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";

import { obtenerLibroPorId } from "../../services/catalogoApi";
import { crearReserva } from "../../services/reservas";
import { obtenerMiLector } from "../../services/lectoresAdmin";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

function obtenerMensajeError(error) {
  const status = error?.response?.status;
  const datos = error?.response?.data;

  if (status === 401) {
    return "Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.";
  }

  if (status === 403) {
    return "Tu cuenta no tiene permisos para realizar esta operación.";
  }

  if (status === 404) {
    return "No se encontró un perfil de lector asociado a tu cuenta. Consulta con la biblioteca para completar tu registro.";
  }

  if (status === 409) {
    return (
        datos?.mensaje ||
        datos?.message ||
        "No es posible registrar esta reserva por una restricción del sistema."
    );
  }

  if (typeof datos === "string" && datos.trim()) {
    return datos;
  }

  return (
      datos?.mensaje ||
      datos?.message ||
      error?.message ||
      "No se pudo registrar la reserva."
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { usuario } = useAuth();
  const { addToCart, items } = useCart();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [loanMessage, setLoanMessage] = useState("");
  const [loanError, setLoanError] = useState("");
  const [reservando, setReservando] = useState(false);
  const [reservaCreada, setReservaCreada] = useState(false);

  // Obtener el libro desde Spring Boot.
  useEffect(() => {
    let cancelado = false;

    async function cargarLibro() {
      try {
        setLoading(true);
        setError("");

        const resultado = await obtenerLibroPorId(id);

        if (!cancelado) {
          setBook(resultado);
          setQuantity(1);
          setAdded(false);
          setLoanMessage("");
          setLoanError("");
          setReservaCreada(false);
        }
      } catch (err) {
        if (!cancelado) {
          setBook(null);

          setError(
              err.response?.status === 404
                  ? "No se encontró el libro solicitado."
                  : err.response?.data?.mensaje ||
                  err.message ||
                  "No se pudo cargar el libro."
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    cargarLibro();

    return () => {
      cancelado = true;
    };
  }, [id]);

  // Cantidad de ejemplares de venta en el carrito.
  const inCart = book
      ? items
          .filter((item) => String(item.id) === String(book.id))
          .reduce(
              (sum, item) => sum + Number(item.quantity || 0),
              0
          )
      : 0;

  const stockVenta = Number(book?.stockVenta ?? 0);
  const stockPrestamo = Number(book?.stockPrestamo ?? 0);

  const remaining = Math.max(0, stockVenta - inCart);

  const puedeComprar =
      book?.saleable === true &&
      stockVenta > 0 &&
      remaining > 0;

  const puedeReservar =
      book?.loanable === true &&
      stockPrestamo > 0;

  // Agregar al carrito.
  const handleAdd = () => {
    setAdded(false);

    if (!puedeComprar || quantity > remaining) {
      return;
    }

    const agregado = addToCart(book, quantity);

    if (!agregado) {
      return;
    }

    setAdded(true);
  };

  // Registrar una reserva con el lector de la sesión.
  const handleLoan = async () => {
    if (reservando || reservaCreada) {
      return;
    }

    setLoanMessage("");
    setLoanError("");

    // Verificar autenticación.
    if (!usuario) {
      navigate("/login", {
        state: {
          from: `/libro/${id}`,
        },
      });

      return;
    }

    // Solo el Cliente puede reservar.
    if (usuario.rol !== "Cliente") {
      setLoanError(
          "Esta operación está disponible únicamente para clientes."
      );
      return;
    }

    // Comprobar disponibilidad del catálogo.
    if (!puedeReservar) {
      setLoanError(
          "No hay ejemplares disponibles para préstamo."
      );
      return;
    }

    try {
      setReservando(true);

      // 1. Obtener el lector vinculado al usuario autenticado.
      const lector = await obtenerMiLector();

      if (!lector || !lector.lectorId) {
        throw new Error(
            "Tu cuenta no tiene un perfil de lector asociado. Consulta con la biblioteca."
        );
      }

      if (lector.activo !== true) {
        throw new Error(
            "Tu perfil de lector está inactivo. Consulta con la biblioteca."
        );
      }

      // 2. Comprobar que el ID del libro sea válido.
      const libroId = Number(book.id);

      if (!Number.isInteger(libroId) || libroId <= 0) {
        throw new Error(
            "El identificador del libro no es válido."
        );
      }

      // 3. Registrar la reserva con los IDs reales.
      const respuesta = await crearReserva({
        lectorId: lector.lectorId,
        libroId,
        observaciones: "",
      });

      setReservaCreada(true);

      setLoanMessage(
          `Tu reserva ${
              respuesta?.reservaId
                  ? `#${respuesta.reservaId} `
                  : ""
          }se registró correctamente. Puedes consultar su estado en Mis reservas.`
      );
    } catch (err) {
      setLoanError(obtenerMensajeError(err));
    } finally {
      setReservando(false);
    }
  };

  if (loading || !book) {
    return (
        <div className="min-h-screen bg-[#F8F6F1]">
          <Navbar />

          <div className="mx-auto max-w-5xl px-5 py-20 text-center">
            <h1 className="text-3xl font-bold text-slate-800">
              {loading
                  ? "Cargando libro..."
                  : error || "Libro no encontrado"}
            </h1>

            {!loading && (
                <Link
                    to="/catalogo"
                    className="mt-5 inline-block text-[#3D7669]"
                >
                  Volver al catálogo
                </Link>
            )}
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main className="mx-auto max-w-6xl px-5 py-10">
          <Link
              to="/catalogo"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
          >
            <ArrowLeft size={18} />
            Volver al catálogo
          </Link>

          <div className="grid gap-10 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">

            {/* PORTADA */}
            <div className="flex items-center justify-center rounded-2xl bg-[#EEEDE7] p-8">
              <img
                  src={book.image || "/placeholder-book.svg"}
                  alt={`Portada de ${book.title}`}
                  className="max-h-[450px] w-auto object-contain shadow-xl"
              />
            </div>

            {/* INFORMACIÓN DEL LIBRO */}
            <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#3D7669]">
              {book.category || "Sin categoría"}
            </span>

              <h1 className="mt-3 text-4xl font-bold text-slate-800">
                {book.title}
              </h1>

              <p className="mt-3 text-lg text-slate-500">
                {book.author || "Autor no especificado"}
              </p>

              <p className="mt-7 text-4xl font-bold text-[#3D7669]">
                S/ {Number(book.price ?? 0).toFixed(2)}
              </p>

              {/* INFORMACIÓN ADICIONAL */}
              <div className="mt-6 space-y-2 text-sm text-slate-600">
                {book.editorial && (
                    <p>
                  <span className="font-semibold">
                    Editorial:
                  </span>{" "}
                      {book.editorial}
                    </p>
                )}

                {book.anioPublicacion && (
                    <p>
                  <span className="font-semibold">
                    Año de publicación:
                  </span>{" "}
                      {book.anioPublicacion}
                    </p>
                )}

                {book.isbn && (
                    <p>
                  <span className="font-semibold">
                    ISBN:
                  </span>{" "}
                      {book.isbn}
                    </p>
                )}
              </div>

              {book.descripcion && (
                  <div className="mt-5">
                    <h2 className="font-semibold text-slate-800">
                      Descripción
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {book.descripcion}
                    </p>
                  </div>
              )}

              {/* DISPONIBILIDAD DE PRÉSTAMO */}
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                <BookOpen
                    size={18}
                    className="text-[#3D7669]"
                />

                {puedeReservar
                    ? `Disponible para préstamo (${stockPrestamo} ejemplares)`
                    : "Préstamo no disponible"}
              </div>

              {/* CANTIDAD PARA COMPRA */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Cantidad
                </p>

                <div className="inline-flex items-center rounded-xl border border-stone-200">
                  <button
                      type="button"
                      disabled={
                          !puedeComprar || quantity <= 1
                      }
                      onClick={() => {
                        setQuantity((q) =>
                            Math.max(1, q - 1)
                        );
                        setAdded(false);
                      }}
                      className="p-3 text-slate-600 disabled:opacity-40"
                      aria-label="Disminuir cantidad"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="w-12 text-center font-semibold">
                  {quantity}
                </span>

                  <button
                      type="button"
                      disabled={
                          !puedeComprar ||
                          quantity >= remaining
                      }
                      onClick={() => {
                        setQuantity((q) =>
                            Math.min(remaining, q + 1)
                        );
                        setAdded(false);
                      }}
                      className="p-3 text-slate-600 disabled:opacity-40"
                      aria-label="Aumentar cantidad"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {puedeComprar && (
                    <p className="mt-2 text-xs text-slate-500">
                      Disponibles para venta: {remaining}
                    </p>
                )}
              </div>

              {/* AGREGAR AL CARRITO */}
              <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!puedeComprar}
                  className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-6 py-4 font-semibold text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ShoppingBag size={20} />

                {puedeComprar
                    ? "Agregar al carrito"
                    : "Sin stock de venta"}
              </button>

              {!puedeComprar && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    No disponible para la venta actualmente.
                  </p>
              )}

              {/* RESERVAR LIBRO */}
              {book.loanable && (
                  <>
                    <button
                        type="button"
                        onClick={handleLoan}
                        disabled={
                            !puedeReservar ||
                            reservando ||
                            reservaCreada
                        }
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-[#3D7669] px-6 py-4 font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
                    >
                      {reservando ? (
                          <RefreshCw
                              size={20}
                              className="animate-spin"
                          />
                      ) : reservaCreada ? (
                          <CheckCircle2 size={20} />
                      ) : (
                          <BookOpen size={20} />
                      )}

                      {reservando
                          ? "Registrando reserva..."
                          : reservaCreada
                              ? "Reserva registrada"
                              : "Reservar ejemplar"}
                    </button>

                    {!puedeReservar && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          No hay ejemplares disponibles para préstamo.
                        </p>
                    )}
                  </>
              )}

              {/* MENSAJE DE RESERVA EXITOSA */}
              {loanMessage && (
                  <div
                      role="status"
                      className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                  >
                    <p>{loanMessage}</p>

                    <Link
                        to="/mis-prestamos"
                        className="mt-3 inline-block font-semibold underline"
                    >
                      Ver mis préstamos y reservas
                    </Link>
                  </div>
              )}

              {/* ERROR DE RESERVA */}
              {loanError && (
                  <div
                      role="alert"
                      className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  >
                    {loanError}
                  </div>
              )}

              {/* MENSAJE DE CARRITO */}
              {added && (
                  <div
                      role="status"
                      className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                  >
                    Libro agregado correctamente.{" "}

                    <Link
                        to="/carrito"
                        className="font-bold underline"
                    >
                      Ver carrito
                    </Link>
                  </div>
              )}

              <p className="mt-5 text-xs text-slate-400">
                La disponibilidad final es validada por el servidor
                al confirmar la operación.
              </p>
            </div>
          </div>
        </main>
      </div>
  );
}
