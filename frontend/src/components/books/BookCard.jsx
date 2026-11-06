import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, BookOpen } from "lucide-react";

import { useCart } from "../../context/CartContext";
import BookPurchaseDrawer from "./BookPurchaseDrawer";

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const { items } = useCart();

  const [showPurchaseDrawer, setShowPurchaseDrawer] = useState(false);

  const stockVenta = Math.max(
      0,
      Number(book.stockVenta ?? 0)
  );

  const stockPrestamo = Math.max(
      0,
      Number(book.stockPrestamo ?? 0)
  );

  const inCart = items
      .filter((item) => String(item.id) === String(book.id))
      .reduce(
          (total, item) => total + Number(item.quantity || 0),
          0
      );

  // Solo permitir la compra si el backend confirmó
  // que el libro está habilitado y tiene stock.
  const canBuy =
      book.saleable === true &&
      stockVenta > inCart;

  // Solo permitir la consulta de préstamo cuando
  // está habilitado y existen ejemplares disponibles.
  const canLoan =
      book.loanable === true &&
      stockPrestamo > 0;

  return (
      <>
        <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-[#EEEDE7]">
            <img
                src={book.image || "/placeholder-book.svg"}
                alt={`Portada de ${book.title}`}
                loading="lazy"
                className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
            />

            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#3D7669] shadow-sm">
                        {book.category || "Sin categoría"}
                    </span>
          </div>

          <div className="space-y-2 px-1 pb-1 pt-4">
            <p className="text-xs text-slate-500">
              {book.author || "Autor no especificado"}
            </p>

            <Link to={`/libro/${book.id}`}>
              <h3 className="line-clamp-2 min-h-12 text-base font-semibold text-slate-800 hover:text-[#3D7669]">
                {book.title}
              </h3>
            </Link>

            <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-bold text-[#3D7669]">
                            S/ {Number(book.price ?? 0).toFixed(2)}
                        </span>

              <span className="text-xs text-slate-500 text-right">
                            {canLoan
                                ? "Préstamo disponible"
                                : "Préstamo no disponible"}
                        </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => setShowPurchaseDrawer(true)}
                  title={
                    canBuy
                        ? `${stockVenta - inCart} ejemplares disponibles para agregar`
                        : "Sin stock disponible para venta"
                  }
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#3D7669] px-2 py-2 text-xs font-medium text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingBag size={14} />
                Comprar
              </button>

              <button
                  type="button"
                  disabled={!canLoan}
                  onClick={() => navigate(`/libro/${book.id}`)}
                  title={
                    canLoan
                        ? "Consultar información de préstamo"
                        : "Préstamo no disponible"
                  }
                  className="flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-2 py-2 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <BookOpen size={14} />
                Ver préstamo
              </button>
            </div>
          </div>
        </article>

        {showPurchaseDrawer && (
            <BookPurchaseDrawer
                book={book}
                onClose={() => setShowPurchaseDrawer(false)}
            />
        )}
      </>
  );
}