
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl font-bold text-slate-800">
          Mi carrito
        </h1>
        <p className="mt-2 text-slate-500">
          {totalItems} ejemplares seleccionados
        </p>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-3xl bg-white px-6 py-20 text-center">
            <ShoppingBag size={52} className="text-stone-300" />
            <h2 className="mt-5 text-2xl font-bold text-slate-800">
              Tu carrito está vacío
            </h2>
            <p className="mt-2 text-slate-500">
              Explora nuestro catálogo y encuentra tu próxima lectura.
            </p>
            <Link
              to="/catalogo"
              className="mt-6 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
            >
              Explorar libros
            </Link>
          </div>
        ) : (
          <div className="mt-9 grid items-start gap-7 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-5 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-28 w-20 rounded-lg object-contain"
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/libro/${item.id}`}
                      className="font-bold text-slate-800 hover:text-[#3D7669]"
                    >
                      {item.title}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.author}
                    </p>

                    <p className="mt-2 font-semibold text-[#3D7669]">
                      S/ {item.price.toFixed(2)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-lg border border-stone-200">
                        <button
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-2"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="w-9 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label="Aumentar cantidad"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-2"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center gap-1 text-sm text-red-500"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <p className="font-bold text-slate-800">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </article>
              ))}
            </div>

            <aside className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Resumen de compra
              </h2>

              <div className="mt-6 flex justify-between text-sm text-slate-600">
                <span>Productos ({totalItems})</span>
                <span>S/ {totalPrice.toFixed(2)}</span>
              </div>

              <div className="mt-5 flex justify-between border-t border-stone-200 pt-5 text-xl font-bold text-slate-800">
                <span>Total</span>
                <span>S/ {totalPrice.toFixed(2)}</span>
              </div>

              <Link
  to="/checkout"
  className="mt-6 block w-full rounded-xl bg-[#3D7669] py-3 text-center font-semibold text-white transition hover:bg-[#254E46]"
>
  Finalizar compra
</Link>

              <button
                type="button"
                onClick={clearCart}
                className="mt-4 w-full text-sm font-medium text-red-500 hover:underline"
              >
                Vaciar carrito
              </button>

              <Link
                to="/catalogo"
                className="mt-5 block text-center text-sm font-medium text-[#3D7669]"
              >
                Seguir explorando libros
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
