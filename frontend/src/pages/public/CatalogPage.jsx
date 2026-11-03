
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, RotateCcw, BookOpen } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import BookCard from "../../components/books/BookCard";
import { obtenerLibros, USE_MOCKS } from "../../services/catalogo";

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    obtenerLibros()
      .then((data) => { if (active) setBooks(data); })
      .catch((err) => { if (active) setError(err.message || "Error al cargar libros."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ["Todas", ...new Set(books.map((book) => book.category))], [books]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [onlyLoans, setOnlyLoans] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");

    const result = books.filter((book) => {
      const matchesSearch =
        book.title.toLocaleLowerCase("es").includes(query) ||
        book.author.toLocaleLowerCase("es").includes(query);

      const matchesCategory =
        category === "Todas" || book.category === category;

      const matchesLoan =
        !onlyLoans || book.loanable;

      return matchesSearch && matchesCategory && matchesLoan;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title, "es"));
    }

    return result;
  }, [books, search, category, onlyLoans, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setCategory("Todas");
    setOnlyLoans(false);
    setSortBy("default");
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* ENCABEZADO */}
        <section className="mb-9">
          <span className="text-sm font-semibold uppercase tracking-widest text-[#3D7669]">
            Nuestra colección
          </span>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-800 md:text-5xl">
            Explora nuestro catálogo
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Encuentra historias increíbles, descubre nuevos autores y
            consulta los libros disponibles para compra o préstamo.
          </p>
        </section>

        {USE_MOCKS && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">Modo demostración: catálogo con datos simulados.</p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {/* FILTROS */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={19} className="text-[#3D7669]" />
            <h2 className="font-semibold text-slate-800">
              Buscar y filtrar
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* BUSCADOR */}
            <div>
              <label
                htmlFor="book-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Buscar libro
              </label>

              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="book-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Título o autor..."
                  className="w-full rounded-xl border border-stone-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#3D7669]"
                />
              </div>
            </div>

            {/* CATEGORÍA */}
            <div>
              <label
                htmlFor="book-category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Categoría
              </label>

              <select
                id="book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* ORDENAMIENTO */}
            <div>
              <label
                htmlFor="book-sort"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ordenar por
              </label>

              <select
                id="book-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
              >
                <option value="default">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="title">Título: A-Z</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={onlyLoans}
                onChange={(e) => setOnlyLoans(e.target.checked)}
                className="h-4 w-4 accent-[#3D7669]"
              />
              Solo libros disponibles para préstamo
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm font-medium text-[#3D7669] hover:underline"
            >
              <RotateCcw size={16} />
              Limpiar filtros
            </button>
          </div>
        </section>

        {/* RESULTADOS */}
        <section className="py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              Libros disponibles
            </h2>

            <span className="text-sm text-slate-500">
              {filteredBooks.length} resultados
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">Cargando libros...</p>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
              <BookOpen size={48} className="text-stone-300" />

              <h3 className="mt-4 text-xl font-semibold text-slate-800">
                No encontramos libros
              </h3>

              <p className="mt-2 text-slate-500">
                Intenta cambiar la búsqueda o los filtros.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-medium text-white"
              >
                Mostrar todos los libros
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
