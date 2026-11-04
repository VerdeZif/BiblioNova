
import { useState } from "react";
import { Search, Package, AlertTriangle, Save } from "lucide-react";
import {
  obtenerLibrosAdminDemo,
  guardarLibroAdminDemo,
} from "../../services/librosAdminDemo";

export default function AdminInventoryPage() {
  const [libros, setLibros] = useState(() => obtenerLibrosAdminDemo());
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [stockVenta, setStockVenta] = useState("");
  const [stockPrestamo, setStockPrestamo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const filtrados = libros.filter((libro) =>
    `${libro.title} ${libro.author}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const stockBajo = libros.filter(
    (libro) =>
      (libro.saleable && Number(libro.stockVenta) <= 3) ||
      (libro.loanable && Number(libro.stockPrestamo) <= 3)
  ).length;

  const iniciarEdicion = (libro) => {
    setEditando(libro.id);
    setStockVenta(String(libro.stockVenta ?? 0));
    setStockPrestamo(String(libro.stockPrestamo ?? 0));
    setMensaje("");
  };

  const guardarStock = (libro) => {
    try {
      const venta = Number(stockVenta);
      const prestamo = Number(stockPrestamo);

      if (
        stockVenta.trim() === "" ||
        stockPrestamo.trim() === "" ||
        !Number.isInteger(venta) ||
        !Number.isInteger(prestamo) ||
        venta < 0 ||
        prestamo < 0
      ) {
        throw new Error("Ingresa cantidades enteras mayores o iguales a cero.");
      }

      guardarLibroAdminDemo({
        ...libro,
        stockVenta: venta,
        stockPrestamo: prestamo,
      });

      setLibros(obtenerLibrosAdminDemo());
      setEditando(null);
      setMensaje("Inventario actualizado correctamente.");
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div>
        <p className="text-sm font-semibold text-[#3D7669]">
          Administración
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Inventario
        </h1>
        <p className="mt-2 text-slate-500">
          Controla las existencias disponibles para venta y préstamo.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Libros registrados", libros.length, Package],
          [
            "Ejemplares para venta",
            libros.reduce((s, l) => s + Number(l.stockVenta || 0), 0),
            Package,
          ],
          ["Libros con stock bajo", stockBajo, AlertTriangle],
        ].map(([titulo, valor, Icon]) => (
          <div key={titulo} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{titulo}</p>
              <Icon size={20} className="text-[#3D7669]" />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-800">
              {valor}
            </p>
          </div>
        ))}
      </div>

      {mensaje && (
        <p role="status" className="mt-6 text-sm text-[#3D7669]">
          {mensaje}
        </p>
      )}

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
          <Search size={19} className="text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar libro..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-slate-500">
              <tr>
                <th className="pb-4">Libro</th>
                <th className="pb-4">Venta</th>
                <th className="pb-4">Préstamo</th>
                <th className="pb-4">Disponibilidad</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((libro) => {
                const enEdicion = editando === libro.id;
                const venta = Number(libro.stockVenta || 0);
                const prestamo = Number(libro.stockPrestamo || 0);

                return (
                  <tr key={libro.id} className="border-b border-stone-100">
                    <td className="py-4">
                      <p className="font-semibold text-slate-800">
                        {libro.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {libro.author}
                      </p>
                    </td>

                    <td className="py-4">
                      {enEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={stockVenta}
                          onChange={(e) => setStockVenta(e.target.value)}
                          className="w-20 rounded-lg border px-2 py-2"
                        />
                      ) : venta}
                    </td>

                    <td className="py-4">
                      {enEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={stockPrestamo}
                          onChange={(e) => setStockPrestamo(e.target.value)}
                          className="w-20 rounded-lg border px-2 py-2"
                        />
                      ) : prestamo}
                    </td>

                    <td className="py-4">
                      {venta + prestamo === 0 ? (
                        <span className="font-semibold text-red-600">
                          Sin existencias
                        </span>
                      ) : venta + prestamo <= 3 ? (
                        <span className="font-semibold text-amber-600">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          Disponible
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-right">
                      {enEdicion ? (
                        <button
                          type="button"
                          onClick={() => guardarStock(libro)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#3D7669] px-3 py-2 text-white"
                        >
                          <Save size={16} />
                          Guardar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(libro)}
                          className="rounded-lg px-3 py-2 font-semibold text-[#3D7669] hover:bg-emerald-50"
                        >
                          Ajustar stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <p className="py-8 text-center text-slate-500">
              No se encontraron libros.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
