import { Link } from "react-router-dom";
import { ShoppingBag, BookOpen } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function BookCard({ book }) {
  const { addToCart, items } = useCart();
  const inCart = items.find((item) => item.id === book.id)?.quantity || 0;
  const canBuy = book.saleable !== false && (book.stockVenta == null || inCart < book.stockVenta);
  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-[#EEEDE7]">
        <img
          src={book.image}
          alt={`Portada de ${book.title}`}
          loading="lazy"
          className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#3D7669] shadow-sm">
          {book.category}
        </span>
      </div>

      <div className="space-y-2 px-1 pb-1 pt-4">
        <p className="text-xs text-slate-500">{book.author}</p>
        <Link to={`/libro/${book.id}`}>
  <h3 className="line-clamp-2 min-h-12 text-base font-semibold text-slate-800 hover:text-[#3D7669]">
    {book.title}
  </h3>
</Link>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#3D7669]">
            S/ {book.price.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500">
            {book.loanable ? "Préstamo disponible" : "Solo venta"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => addToCart(book)}
            title={canBuy ? "Agregar al carrito" : "Sin stock disponible"}
            className="flex items-center justify-center gap-1 rounded-lg bg-[#3D7669] px-2 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            <ShoppingBag size={14} />
            Comprar
          </button>

          <button
            type="button"
            disabled={!book.loanable}
            onClick={() => { window.location.assign(`/libro/${book.id}`); }}
            title={book.loanable ? "Consultar información de préstamo" : "Préstamo no disponible"}
            className="flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-2 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            <BookOpen size={14} />
            Ver préstamo
          </button>
        </div>
      </div>
    </article>
  );
}
