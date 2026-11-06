import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    X,
    Plus,
    Minus,
    ShoppingBag,
    CheckCircle2,
    BookOpen,
    UserRound,
    Tag,
    Package,
} from "lucide-react";

import { useCart } from "../../context/CartContext";

export default function BookPurchaseDrawer({ book, onClose }) {
    const { addToCart, items } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState("");

    const alreadyInCart = items
        .filter((item) => String(item.id) === String(book.id))
        .reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );

    const stock = Math.max(
        0,
        Number(book.stockVenta ?? 0)
    );

    const available = Math.max(
        0,
        stock - alreadyInCart
    );

    const price = Number(book.price ?? 0);

    const subtotal = price * quantity;

    // Validaciones para confirmar la incorporación al carrito.
    const canConfirm =
        !confirmed &&
        book.saleable === true &&
        stock > 0 &&
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        available >= quantity &&
        Number.isFinite(price) &&
        price >= 0;

    // Bloquear desplazamiento mientras el panel está abierto.
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    // Confirmar y agregar al carrito.
    const confirmPurchase = () => {
        setError("");

        if (!canConfirm) {
            setError(
                "No es posible agregar la cantidad seleccionada. Revisa la disponibilidad."
            );
            return;
        }

        const agregado = addToCart(book, quantity);

        if (!agregado) {
            setError(
                "No se pudo agregar el libro. Comprueba el stock disponible e inténtalo nuevamente."
            );
            return;
        }

        setConfirmed(true);
    };

    return (
        <div className="fixed inset-0 z-[100]">

            {/* Fondo oscuro */}
            <button
                type="button"
                aria-label="Cerrar panel de compra"
                className="absolute inset-0 h-full w-full cursor-default bg-black/50"
                onClick={onClose}
            />

            {/* Panel derecho */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Confirmar compra de libro"
                className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#F8F6F1] shadow-2xl"
            >

                {/* ENCABEZADO */}
                <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {confirmed
                                ? "Producto agregado"
                                : "Confirmar compra"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            BiblioNova · Librería
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar panel"
                        className="rounded-full p-2 text-slate-500 hover:bg-stone-100"
                    >
                        <X size={22} />
                    </button>
                </header>

                {/* CONTENIDO */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6">

                    {confirmed && (
                        <div
                            role="status"
                            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                        >
                            <CheckCircle2
                                size={24}
                                className="shrink-0 text-emerald-600"
                            />

                            <div>
                                <p className="font-semibold text-emerald-800">
                                    ¡Agregado correctamente!
                                </p>

                                <p className="mt-1 text-sm text-emerald-700">
                                    Se agregaron {quantity} ejemplares a tu carrito.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* INFORMACIÓN DEL LIBRO */}
                    <div className="flex gap-5 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex h-44 w-32 shrink-0 items-center justify-center rounded-xl bg-stone-100 p-2">
                            <img
                                src={book.image || "/placeholder-book.svg"}
                                alt={`Portada de ${book.title}`}
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                            <span className="inline-block rounded-full bg-[#EDF5F1] px-3 py-1 text-xs font-medium text-[#3D7669]">
                                {book.category || "Sin categoría"}
                            </span>

                            <h3 className="text-lg font-bold text-slate-800">
                                {book.title}
                            </h3>

                            <p className="text-sm text-slate-500">
                                {book.author || "Autor no especificado"}
                            </p>

                            <p className="text-2xl font-bold text-[#3D7669]">
                                S/ {price.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* CARACTERÍSTICAS */}
                    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800">
                            Características del libro
                        </h3>

                        <div className="flex items-center gap-3 text-sm">
                            <BookOpen size={18} className="text-[#3D7669]" />

                            <span className="text-slate-500">Título:</span>

                            <span className="ml-auto text-right font-medium">
                                {book.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <UserRound size={18} className="text-[#3D7669]" />

                            <span className="text-slate-500">Autor:</span>

                            <span className="ml-auto text-right font-medium">
                                {book.author || "No especificado"}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Tag size={18} className="text-[#3D7669]" />

                            <span className="text-slate-500">Categoría:</span>

                            <span className="ml-auto font-medium">
                                {book.category || "No especificada"}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Package size={18} className="text-[#3D7669]" />

                            <span className="text-slate-500">Disponibilidad:</span>

                            <span className="ml-auto text-right font-medium text-[#3D7669]">
                                {stock > 0
                                    ? `${stock} ejemplares en inventario`
                                    : "Sin stock"}
                            </span>
                        </div>

                        <div className="border-t border-stone-100 pt-3">
                            <p className="text-sm text-slate-600">
                                {book.loanable
                                    ? "Este libro también está disponible para préstamo."
                                    : "Este libro está disponible únicamente para venta."}
                            </p>
                        </div>

                        <div className="space-y-3 border-t border-stone-100 pt-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">ISBN</span>

                                <span className="font-medium">
                                    {book.isbn || "No especificado"}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Editorial</span>

                                <span className="font-medium">
                                    {book.editorial || "No especificada"}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">
                                    Año de publicación
                                </span>

                                <span className="font-medium">
                                    {book.anioPublicacion || "No especificado"}
                                </span>
                            </div>

                            <div className="space-y-2 border-t border-stone-100 pt-4">
                                <h4 className="font-semibold text-slate-800">
                                    Sinopsis
                                </h4>

                                <p className="leading-relaxed text-slate-600">
                                    {book.descripcion || "Sin descripción disponible."}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CANTIDAD */}
                    {!confirmed && (
                        <section className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                            <div>
                                <h3 className="font-semibold text-slate-800">
                                    Cantidad
                                </h3>

                                <p className="text-xs text-slate-500">
                                    {available} ejemplares disponibles para agregar
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    disabled={quantity <= 1}
                                    onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                    }
                                    className="rounded-lg border p-2 disabled:opacity-30"
                                    aria-label="Disminuir cantidad"
                                >
                                    <Minus size={16} />
                                </button>

                                <span className="font-bold">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    disabled={quantity >= available}
                                    onClick={() =>
                                        setQuantity((q) =>
                                            Math.min(available, q + 1)
                                        )
                                    }
                                    className="rounded-lg border p-2 disabled:opacity-30"
                                    aria-label="Aumentar cantidad"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </section>
                    )}

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}
                </div>

                {/* PIE DEL PANEL */}
                <footer className="space-y-4 border-t border-stone-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                            Subtotal estimado
                        </span>

                        <span className="text-2xl font-bold text-[#3D7669]">
                            S/ {subtotal.toFixed(2)}
                        </span>
                    </div>

                    {confirmed ? (
                        <>
                            <Link
                                to="/carrito"
                                onClick={onClose}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] py-4 font-semibold text-white"
                            >
                                <ShoppingBag size={19} />
                                Ver carrito
                            </Link>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full rounded-xl border border-stone-300 py-3 font-medium text-slate-700"
                            >
                                Seguir comprando
                            </button>
                        </>
                    ) : (
                        <>
                            {!canConfirm && !error && (
                                <p className="text-center text-sm text-red-600">
                                    {available <= 0
                                        ? "No quedan ejemplares disponibles. Revisa tu carrito."
                                        : "Revisa la cantidad y la disponibilidad del libro."}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={confirmPurchase}
                                disabled={!canConfirm}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] py-4 font-semibold text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ShoppingBag size={19} />
                                Confirmar y agregar al carrito
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                            >
                                Cancelar
                            </button>
                        </>
                    )}

                    <p className="text-center text-xs text-slate-400">
                        Agregar al carrito no realiza ningún cobro.
                    </p>
                </footer>
            </aside>
        </div>
    );
}