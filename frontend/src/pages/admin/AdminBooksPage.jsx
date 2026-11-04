
import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";

import {
  obtenerLibrosAdminDemo,
  guardarLibroAdminDemo,
  eliminarLibroAdminDemo,
} from "../../services/librosAdminDemo";

const formularioInicial = {
  title: "",
  author: "",
  category: "",
  price: "",
  image: "",
  description: "",
  isbn: "",
  editorial: "",
  anioPublicacion: "",
  stockVenta: 0,
  stockPrestamo: 0,
  saleable: true,
  loanable: false,
};

export default function AdminBooksPage() {
  const [libros, setLibros] = useState(
    () => obtenerLibrosAdminDemo()
  );
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState("");

  const filtrados = libros.filter((libro) =>
    `${libro.title} ${libro.author} ${libro.category}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => {
    setFormulario({ ...formularioInicial });
    setEditando(null);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (libro) => {
    setFormulario({ ...libro });
    setEditando(libro.id);
    setError("");
    setModalAbierto(true);
  };

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const guardar = (event) => {
    event.preventDefault();

    try {
      guardarLibroAdminDemo({
        ...formulario,
        id: editando,
      });

      setLibros(obtenerLibrosAdminDemo());
      setModalAbierto(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = (libro) => {
    if (!window.confirm(`¿Eliminar "${libro.title}" del catálogo?`)) {
      return;
    }

    setLibros(eliminarLibroAdminDemo(libro.id));
  };

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#3D7669]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Gestión de libros
          </h1>
          <p className="mt-2 text-slate-500">
            Administra los libros disponibles en BiblioNova.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white hover:bg-[#315e55]"
        >
          <Plus size={19} />
          Nuevo libro
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total libros", libros.length],
          ["Disponibles para venta", libros.filter((l) => l.saleable && l.stockVenta > 0).length],
          ["Disponibles para préstamo", libros.filter((l) => l.loanable && l.stockPrestamo > 0).length],
        ].map(([titulo, valor]) => (
          <div key={titulo} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{titulo}</p>
            <p className="mt-2 text-3xl font-bold text-[#3D7669]">
              {valor}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
          <Search size={19} className="text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por título, autor o categoría..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-slate-500">
              <tr>
                <th className="pb-4">Libro</th>
                <th className="pb-4">Categoría</th>
                <th className="pb-4">Precio</th>
                <th className="pb-4">Stock venta</th>
                <th className="pb-4">Stock préstamo</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((libro) => (
                <tr key={libro.id} className="border-b border-stone-100">
                  <td className="py-4">
                    <div className="flex min-w-48 items-center gap-3">
                      <img
                        src={libro.image}
                        alt={libro.title}
                        className="h-16 w-11 rounded object-contain"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {libro.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {libro.author}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td>{libro.category}</td>
                  <td>S/ {Number(libro.price).toFixed(2)}</td>
                  <td>{libro.stockVenta}</td>
                  <td>{libro.stockPrestamo}</td>

                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(libro)}
                        aria-label={`Editar ${libro.title}`}
                        className="rounded-lg p-2 text-[#3D7669] hover:bg-emerald-50"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminar(libro)}
                        aria-label={`Eliminar ${libro.title}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <p className="py-10 text-center text-slate-500">
              No se encontraron libros.
            </p>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editando ? "Editar libro" : "Nuevo libro"}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editando ? "Editar libro" : "Registrar libro"}
              </h2>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                aria-label="Cerrar formulario"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardar} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["title", "Título", "text"],
                  ["author", "Autor", "text"],
                  ["category", "Categoría", "text"],
                  ["price", "Precio", "number"],
                  ["isbn", "ISBN", "text"],
                  ["editorial", "Editorial", "text"],
                  ["anioPublicacion", "Año de publicación", "number"],
                  ["stockVenta", "Stock para venta", "number"],
                  ["stockPrestamo", "Stock para préstamo", "number"],
                  ["image", "URL de portada", "text"],
                ].map(([campo, etiqueta, tipo]) => (
                  <label key={campo} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {etiqueta}
                    </span>

                    <input
                      type={tipo}
                      min={tipo === "number" ? 0 : undefined}
                      step={campo === "price" ? "0.01" : tipo === "number" ? "1" : undefined}
                      required={["title", "author", "price"].includes(campo)}
                      value={formulario[campo] ?? ""}
                      onChange={(event) =>
                        actualizarCampo(campo, event.target.value)
                      }
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                    />
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Descripción
                </span>
                <textarea
                  rows={3}
                  value={formulario.description ?? ""}
                  onChange={(event) =>
                    actualizarCampo("description", event.target.value)
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                />
              </label>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(formulario.saleable)}
                    onChange={(event) =>
                      actualizarCampo("saleable", event.target.checked)
                    }
                  />
                  Habilitado para venta
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(formulario.loanable)}
                    onChange={(event) =>
                      actualizarCampo("loanable", event.target.checked)
                    }
                  />
                  Habilitado para préstamo
                </label>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                >
                  {editando ? "Guardar cambios" : "Registrar libro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
