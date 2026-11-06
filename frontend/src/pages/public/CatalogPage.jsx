import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import BookCard from "../../components/books/BookCard";

import { obtenerLibros, USE_MOCKS } from "../../services/catalogo";
import { listarCategorias } from "../../services/catalogoApi";

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categoriesApi, setCategoriesApi] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [error, setError] = useState("");
  const [errorCategories, setErrorCategories] = useState("");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState(
      searchParams.get("categoria") || "Todas"
  );

  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // Sincronizar el filtro con la categoría recibida en la URL.
  useEffect(() => {
    setCategory(searchParams.get("categoria") || "Todas");
  }, [searchParams]);

  // Cargar libros reales.
  useEffect(() => {
    let active = true;

    async function cargarLibros() {
      try {
        setLoading(true);
        setError("");

        const data = await obtenerLibros();

        if (active) {
          setBooks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setBooks([]);

          setError(
              err.response?.data?.mensaje ||
              err.message ||
              "No se pudieron cargar los libros."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    cargarLibros();

    return () => {
      active = false;
    };
  }, []);

  // Cargar categorías reales.
  useEffect(() => {
    let active = true;

    async function cargarCategorias() {
      try {
        setLoadingCategories(true);
        setErrorCategories("");

        const data = await listarCategorias();

        if (active) {
          setCategoriesApi(
              Array.isArray(data) ? data : []
          );
        }
      } catch (err) {
        if (active) {
          setCategoriesApi([]);

          setErrorCategories(
              err.response?.data?.mensaje ||
              "No se pudieron cargar las categorías."
          );
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    }

    cargarCategorias();

    return () => {
      active = false;
    };
  }, []);

  // Construir las opciones utilizando las categorías del backend
  // y los nombres de categoría asociados a los libros.
  const categories = useMemo(() => {
    const nombresApi = categoriesApi
        .map((item) => item.name || item.nombre)
        .filter(Boolean);

    const nombresLibros = books
        .map((book) => book.category)
        .filter(Boolean);

    const unicas = [
      ...new Set([...nombresApi, ...nombresLibros]),
    ];

    return [
      "Todas",
      ...unicas.sort((a, b) => a.localeCompare(b, "es")),
    ];
  }, [categoriesApi, books]);

  // Actualizar la categoría también en la dirección del navegador.
  const handleCategoryChange = (value) => {
    setCategory(value);

    const params = new URLSearchParams(searchParams);

    if (value === "Todas") {
      params.delete("categoria");
    } else {
      params.set("categoria", value);
    }

    setSearchParams(params, { replace: true });
  };

  // Aplicar búsqueda, categoría, disponibilidad y ordenamiento.
  const filteredBooks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");

    const selectedCategory = category
        .trim()
        .toLocaleLowerCase("es");

    const result = books.filter((book) => {
      const titulo = String(book.title || "")
          .toLocaleLowerCase("es");

      const autor = String(book.author || "")
          .toLocaleLowerCase("es");

      const isbn = String(book.isbn || "")
          .toLocaleLowerCase("es");

      const editorial = String(book.editorial || "")
          .toLocaleLowerCase("es");

      const categoriaLibro = String(book.category || "")
          .toLocaleLowerCase("es");

      const matchesSearch =
          !query ||
          titulo.includes(query) ||
          autor.includes(query) ||
          isbn.includes(query) ||
          editorial.includes(query);

      const matchesCategory =
          category === "Todas" ||
          categoriaLibro === selectedCategory;

      const matchesAvailability =
    availability === "all" ||
    (
        availability === "buy" &&
        book.saleable === true &&
        Number(book.stockVenta ?? 0) > 0
    ) ||
    (
        availability === "loan" &&
        book.loanable === true &&
        Number(book.stockPrestamo ?? 0) > 0
    );

      return (
          matchesSearch &&
          matchesCategory &&
          matchesAvailability
      );
    });

    // Copiar el resultado para no modificar el estado original.
    const ordered = [...result];

    if (sortBy === "price-asc") {
      ordered.sort(
          (a, b) =>
              Number(a.price || 0) - Number(b.price || 0)
      );
    }

    if (sortBy === "price-desc") {
      ordered.sort(
          (a, b) =>
              Number(b.price || 0) - Number(a.price || 0)
      );
    }

    if (sortBy === "title") {
      ordered.sort(
          (a, b) =>
              String(a.title || "").localeCompare(
                  String(b.title || ""),
                  "es"
              )
      );
    }

    return ordered;
  }, [books, search, category, availability, sortBy]);

  // Limpiar todos los filtros.
  const clearFilters = () => {
    setSearch("");
    setAvailability("all" );
    setSortBy("default");
    setCategory("Todas");
    setSearchParams({}, { replace: true });
  };

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main className="mx-auto max-w-7xl px-5 py-10">

          {/* ENCABEZADO */}
          <section className="mb-9 rounded-[1.75rem] border border-[#E6DFEB] bg-gradient-to-r from-[#F0EBF5] via-[#F3F1EC] to-[#E8EEE8] px-7 py-9 md:px-10 md:py-11">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#67458B]">
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

          {USE_MOCKS && (
              <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
                Modo demostración: catálogo con datos simulados.
              </p>
          )}

          {error && (
              <p
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
          )}

          {/* FILTROS */}
          <section className="rounded-[1.5rem] border border-[#E5E0E8] bg-white p-6 shadow-sm md:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-5">
              <SlidersHorizontal
                  size={19}
                  className="text-[#3D7669]"
              />

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
                      onChange={(e) =>
                          setSearch(e.target.value.slice(0, 100))
                      }
                      maxLength={100}
                      placeholder="Título, autor o ISBN..."
                      className="w-full rounded-xl border border-stone-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#3D7669]"
                  />
                </div>

                {search.length === 100 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Has alcanzado el máximo de 100 caracteres.
                    </p>
                )}
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
                    onChange={(e) =>
                        handleCategoryChange(e.target.value)
                    }
                    disabled={loadingCategories && categories.length <= 1}
                    className="w-full rounded-xl border border-stone-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                >
                  {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                  ))}
                </select>

                {loadingCategories && (
                    <p className="mt-1 text-xs text-slate-400">
                      Cargando categorías...
                    </p>
                )}

                {errorCategories && (
                    <p
                        role="alert"
                        className="mt-1 text-xs text-amber-700"
                    >
                      {errorCategories}
                    </p>
                )}
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
                  <option value="price-asc">
                    Precio: menor a mayor
                  </option>
                  <option value="price-desc">
                    Precio: mayor a menor
                  </option>
                  <option value="title">
                    Título: A-Z
                  </option>
                </select>
              </div>
            </div>

           
<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">

  {/* FILTRO DE DISPONIBILIDAD */}
  <div className="flex flex-wrap items-center gap-3">
    <label
      htmlFor="book-availability"
      className="text-sm font-medium text-slate-700"
    >
      Disponibilidad
    </label>

    <select
      id="book-availability"
      value={availability}
      onChange={(e) => setAvailability(e.target.value)}
      className="rounded-xl border border-stone-200 bg-[#FAF9F7] px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#67458B] focus:ring-2 focus:ring-violet-100"
    >
      <option value="all">Todos los libros</option>
      <option value="buy">Disponibles para compra</option>
      <option value="loan">Disponibles para préstamo</option>
    </select>
  </div>

  {/* LIMPIAR FILTROS */}
  <button
    type="button"
    onClick={clearFilters}
    className="flex items-center gap-2 text-sm font-medium text-[#3D7669] transition hover:text-[#67458B] hover:underline"
  >
    <RotateCcw size={16} />
    Limpiar filtros
  </button>

</div>
</section>


          {/* RESULTADOS */}
          <section className="py-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
  <h2 className="text-2xl font-bold tracking-tight text-slate-800">
    Explorar libros
  </h2>
  <p className="mt-1 text-sm text-slate-500">
    Encuentra tu próxima lectura favorita.
  </p>
</div>

              <span className="text-sm text-slate-500">
                            {loading ? "..." : `${filteredBooks.length} resultados`}
                        </span>
            </div>

            {loading ? (
                <p className="py-10 text-center text-slate-500">
                  Cargando libros...
                </p>
            ) : error ? (
                <div
                    role="alert"
                    className="rounded-2xl bg-red-50 px-6 py-12 text-center text-red-700"
                >
                  No fue posible cargar el catálogo. Intenta nuevamente.
                </div>
            ) : filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredBooks.map((book) => (
                      <BookCard
                          key={book.id}
                          book={book}
                      />
                  ))}
                </div>
            ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
                  <BookOpen
                      size={48}
                      className="text-stone-300"
                  />

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