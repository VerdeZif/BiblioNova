
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const pedido = state?.pedido;

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <CheckCircle2
            size={64}
            className="mx-auto text-[#3D7669]"
          />

          <h1 className="mt-5 text-3xl font-bold text-slate-800">
            {pedido
              ? "¡Pedido registrado!"
              : "No hay un pedido para mostrar"}
          </h1>

          {pedido && (
            <>
              <p className="mt-3 text-slate-500">
                Tu pedido de demostración se guardó correctamente.
              </p>

              <div className="mt-8 rounded-xl bg-[#F0F7F4] p-5">
                <p className="text-sm text-slate-500">
                  Número de pedido
                </p>
                <p className="mt-1 text-xl font-bold text-[#3D7669]">
                  {pedido.numero}
                </p>

                <p className="mt-4 text-sm text-slate-500">
                  Total del pedido
                </p>
                <p className="text-2xl font-bold">
                  S/ {pedido.total.toFixed(2)}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Estado: {pedido.estado}
                </p>
              </div>
            </>
          )}

          <Link
            to="/catalogo"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
          >
            <ShoppingBag size={18} />
            Volver al catálogo
          </Link>
        </div>
      </main>
    </div>
  );
}
