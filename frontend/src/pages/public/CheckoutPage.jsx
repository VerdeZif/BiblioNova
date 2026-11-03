import { crearPedidoDemo } from "../../services/pedidosDemo";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  MapPin,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const navigate = useNavigate();

  const [error, setError] = useState("");

  const [deliveryType, setDeliveryType] = useState("recojo");
  const [paymentMethod, setPaymentMethod] = useState("tienda");
  const changeDeliveryType = (type) => {
  setDeliveryType(type);

  if (type === "delivery") {
    setPaymentMethod("contraentrega");
  } else {
    setPaymentMethod("tienda");
  }
};
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    direccion: "",
    distrito: "",
    referencia: "",
  });

  const deliveryCost = deliveryType === "delivery" ? 8 : 0;
  const total = totalPrice + deliveryCost;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

const confirmarPedido = () => {
  setError("");

  // Validar datos del comprador
  if (!form.nombres.trim() || !form.apellidos.trim()) {
    setError("Debes ingresar tus nombres y apellidos.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
    setError("Ingresa un correo electrónico válido.");
    return;
  }

  if (!/^\d{9}$/.test(form.telefono.trim())) {
    setError("Ingresa un número de teléfono válido de 9 dígitos.");
    return;
  }

  // Validar dirección si seleccionó delivery
  if (
    deliveryType === "delivery" &&
    (!form.direccion.trim() || !form.distrito.trim())
  ) {
    setError("Completa la dirección y el distrito de entrega.");
    return;
  }

  // No permitir pagos online todavía
  if (paymentMethod === "online") {
    setError("El pago online todavía no está disponible.");
    return;
  }

  if (items.length === 0) {
    setError("Tu carrito está vacío.");
    return;
  }

  try {
    // Crear pedido de demostración
    const pedido = crearPedidoDemo(
      {
        ...form,
        tipoEntrega: deliveryType,
        metodoPago: paymentMethod,
      },
      items,
      total
    );

    // Vaciar carrito después de guardar el pedido
    clearCart();

    // Mostrar comprobante
    navigate("/pedido-confirmado", {
      state: { pedido },
    });

  } catch (err) {
    setError(err.message || "Ocurrió un error al registrar el pedido.");
  }
};

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]";

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <Link
          to="/carrito"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
        >
          <ArrowLeft size={17} />
          Volver al carrito
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-800 md:text-4xl">
          Finalizar compra
        </h1>
        <p className="mt-2 text-slate-500">
          Completa tus datos para preparar tu pedido.
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-12 text-center">
            <ShoppingBag
              size={45}
              className="mx-auto text-stone-300"
            />
            <h2 className="mt-4 text-xl font-bold">
              No tienes productos en tu carrito
            </h2>
            <Link
              to="/catalogo"
              className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-7 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Datos del comprador */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">
                  1. Datos del comprador
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="Nombres"
                    value={form.nombres}
                    onChange={(e) =>
                      updateField("nombres", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Apellidos"
                    value={form.apellidos}
                    onChange={(e) =>
                      updateField("apellidos", e.target.value)
                    }
                  />
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="Correo electrónico"
                    value={form.correo}
                    onChange={(e) =>
                      updateField("correo", e.target.value)
                    }
                  />
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="Teléfono"
                    value={form.telefono}
                    onChange={(e) =>
                      updateField("telefono", e.target.value)
                    }
                  />
                </div>
              </section>

              {/* Tipo de entrega */}
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">
                  2. Método de entrega
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => changeDeliveryType("recojo")}
                    className={`rounded-xl border-2 p-5 text-left ${
                      deliveryType === "recojo"
                        ? "border-[#3D7669] bg-[#F0F7F4]"
                        : "border-stone-200"
                    }`}
                  >
                    <Store className="text-[#3D7669]" size={25} />
                    <p className="mt-3 font-bold">Recojo en tienda</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Gratis
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => changeDeliveryType("delivery")}
                    className={`rounded-xl border-2 p-5 text-left ${
                      deliveryType === "delivery"
                        ? "border-[#3D7669] bg-[#F0F7F4]"
                        : "border-stone-200"
                    }`}
                  >
                    <Truck className="text-[#3D7669]" size={25} />
                    <p className="mt-3 font-bold">Delivery</p>
                    <p className="mt-1 text-sm text-slate-500">
                      S/ 8.00 (referencial)
                    </p>
                  </button>
                </div>

                {deliveryType === "delivery" && (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin size={17} />
                      Dirección de entrega
                    </div>

                    <input
                      className={inputClass}
                      placeholder="Dirección completa"
                      value={form.direccion}
                      onChange={(e) =>
                        updateField("direccion", e.target.value)
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Distrito"
                      value={form.distrito}
                      onChange={(e) =>
                        updateField("distrito", e.target.value)
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Referencia (opcional)"
                      value={form.referencia}
                      onChange={(e) =>
                        updateField("referencia", e.target.value)
                      }
                    />
                  </div>
                )}
              </section>

              
{/* Método de pago */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-bold text-slate-800">
    3. Método de pago
  </h2>

  <div className="mt-5 space-y-3">
    {deliveryType === "recojo" && (
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "tienda"}
          onChange={() => setPaymentMethod("tienda")}
        />
        <Store size={20} className="text-[#3D7669]" />
        <span>Pago al recoger en tienda</span>
      </label>
    )}

    {deliveryType === "delivery" && (
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4">
        <input
          type="radio"
          name="payment"
          checked={paymentMethod === "contraentrega"}
          onChange={() => setPaymentMethod("contraentrega")}
        />
        <Banknote size={20} className="text-[#3D7669]" />
        <div>
          <p className="font-medium">Pago contraentrega</p>
          <p className="text-xs text-slate-500">
            Paga en efectivo cuando recibas tus libros.
          </p>
        </div>
      </label>
    )}

    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4">
      <input
        type="radio"
        name="payment"
        checked={paymentMethod === "online"}
        onChange={() => setPaymentMethod("online")}
      />
      <CreditCard size={20} className="text-[#3D7669]" />
      <span>Pago online (próximamente)</span>
    </label>
  </div>

  {paymentMethod === "online" && (
    <p className="mt-3 text-sm text-amber-700">
      La pasarela de pago todavía no está integrada.
      No se realizará ningún cobro.
    </p>
  )}

  {paymentMethod === "contraentrega" && (
    <p className="mt-3 rounded-lg bg-[#F0F7F4] p-3 text-sm text-[#254E46]">
      El pago se realizará al recibir el pedido.
      El pedido permanecerá pendiente de pago hasta
      confirmar el cobro.
    </p>
  )}
</section>

            </div>

            {/* Resumen */}
            <aside className="rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-slate-800">
                Resumen del pedido
              </h2>

              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-12 rounded object-contain"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-semibold">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm">
                <div className="flex justify-between">
                  <span>Productos ({totalItems})</span>
                  <span>S/ {totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span>
                    {deliveryCost === 0
                      ? "Gratis"
                      : `S/ ${deliveryCost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex justify-between border-t border-stone-200 pt-5 text-xl font-bold">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>

             {error && (
  <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {error}
  </p>
)}

<button
  type="button"
  onClick={confirmarPedido}
  disabled={paymentMethod === "online"}
  className="mt-6 w-full rounded-xl bg-[#3D7669] py-3 font-semibold text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-40"
>
  Confirmar pedido
</button>

              <p className="mt-3 text-center text-xs text-slate-400">
                No se procesarán pagos ni pedidos reales.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
