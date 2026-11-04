import { solicitarPrestamoDemo } from "../../services/prestamosDemo";   
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Minus, Plus, ShoppingBag } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { obtenerLibros, USE_MOCKS } from "../../services/catalogo";
import { useCart } from "../../context/CartContext";

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    obtenerLibros()
      .then((list) => { if (active) setBook(list.find((item) => item.id === Number(id)) || null); })
      .catch((err) => { if (active) setError(err.message || "Error al cargar el libro."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

 const [quantity, setQuantity] = useState(1);
const [added, setAdded] = useState(false);
const [loanMessage, setLoanMessage] = useState("");
const [loanError, setLoanError] = useState("");

const { addToCart, items } = useCart();
  if (loading || !book) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            {loading ? "Cargando libro..." : error || "Libro no encontrado"}
          </h1>
          <Link to="/catalogo" className="mt-5 inline-block text-[#3D7669]">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }


  const inCart = items.filter((item) => String(item.id) === String(book.id)).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const remaining = Math.max(0, Number(book.stockVenta ?? 0) - inCart);
  const canBuy = book.saleable !== false && remaining > 0;
  const canLoan = book.loanable === true && Number(book.stockPrestamo ?? 0) > 0;

  const handleAdd = () => {
    if (!canBuy || quantity > remaining) return;

    addToCart(book, quantity);
    setAdded(true);
  };

  const handleLoan = () => {
    setLoanMessage("");
    setLoanError("");

    try {
      solicitarPrestamoDemo(book);
      setLoanMessage(
        "Solicitud de préstamo registrada correctamente."
      );
    } catch (err) {
      setLoanError(
        err.message || "No se pudo solicitar el préstamo."
      );
    }
  };

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
          <div className="flex items-center justify-center rounded-2xl bg-[#EEEDE7] p-8">
            <img
              src={book.image}
              alt={`Portada de ${book.title}`}
              className="max-h-[450px] w-auto object-contain shadow-xl"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#3D7669]">
              {book.category}
            </span>

            <h1 className="mt-3 text-4xl font-bold text-slate-800">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-slate-500">
              {book.author}
            </p>

            <p className="mt-7 text-4xl font-bold text-[#3D7669]">
              S/ {book.price.toFixed(2)}
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
              <BookOpen size={18} className="text-[#3D7669]" />
              {canLoan
                ? `Disponible para préstamo (${book.stockPrestamo} ejemplares)`
                : "Préstamo no disponible"}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Cantidad
              </p>

              <div className="inline-flex items-center rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 text-slate-600"
                  aria-label="Disminuir cantidad"
                >
                  <Minus size={18} />
                </button>

                <span className="w-12 text-center font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={!canBuy || quantity >= remaining}
                  onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
                  className="p-3 text-slate-600"
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canBuy || quantity > remaining}
              className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-6 py-4 font-semibold text-white transition hover:bg-[#315e55]"
            >
              <ShoppingBag size={20} />
              {canBuy ? "Agregar al carrito" : "Sin stock de venta"}
            </button>

{book.loanable && (
  <button
    type="button"
    onClick={handleLoan}
    disabled={!canLoan}
    className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-[#3D7669] px-6 py-4 font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4]"
  >
    <BookOpen size={20} />
    Solicitar préstamo
  </button>
)}

{loanMessage && (
  <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
    {loanMessage}{" "}
    <Link to="/mis-prestamos" className="font-bold underline">
      Ver mis préstamos
    </Link>
  </div>
)}

{loanError && (
  <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
    {loanError}
  </div>
)}

            {added && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                Libro agregado correctamente.{" "}
                <Link to="/carrito" className="font-bold underline">
                  Ver carrito
                </Link>
              </div>
            )}

            <p className="mt-5 text-xs text-slate-400">
              {USE_MOCKS ? "Datos de demostración. " : ""}La compra todavía no procesa pagos reales.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
