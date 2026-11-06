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
        
<article className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5">

  {/* PORTADA */}
  <Link
    to={`/libro/${book.id}`}
    className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#F0EEE8]"
  >
    <img
      src={book.image || "/placeholder-book.svg"}
      alt={`Portada de ${book.title}`}
      loading="lazy"
      className="h-full w-full object-contain p-4 drop-shadow-md transition-transform duration-500 group-hover:scale-105"
    />

    <span className="absolute left-3 top-3 max-w-[85%] truncate rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#3D7669] shadow-sm">
      {book.category || "Sin categoría"}
    </span>
  </Link>

  {/* INFORMACIÓN */}
  <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
    <p className="truncate text-xs font-medium text-slate-500">
      {book.author || "Autor no especificado"}
    </p>

    <Link to={`/libro/${book.id}`} className="mt-2">
      <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-800 transition-colors hover:text-[#3D7669]">
        {book.title}
      </h3>
    </Link>

    <div className="mt-auto pt-5">
      {/* PRECIO */}
      <p className="text-xl font-bold tracking-tight text-[#3D7669]">
        S/ {Number(book.price ?? 0).toFixed(2)}
      </p>

      {/* DISPONIBILIDAD */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            canLoan ? "bg-emerald-500" : "bg-stone-400"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            canLoan ? "text-emerald-700" : "text-slate-500"
          }`}
        >
          {canLoan
            ? "Préstamo disponible"
            : "Préstamo no disponible"}
        </span>
      </div>

      {/* ACCIONES */}
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => setShowPurchaseDrawer(true)}
          title={
            canBuy
              ? `${stockVenta - inCart} ejemplares disponibles para agregar`
              : "Sin stock disponible para venta"
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingBag size={17} />
{canBuy ? "Comprar" : "Sin stock"}
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
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#3D7669] hover:bg-emerald-50 hover:text-[#3D7669] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <BookOpen size={17} />
          Ver préstamo
        </button>
      </div>
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