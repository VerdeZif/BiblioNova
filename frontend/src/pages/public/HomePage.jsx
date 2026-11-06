import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Truck,
  LibraryBig,
  Rocket,
  Sprout,
  WandSparkles,
  Feather,
  Landmark,
  Heart,
  ScrollText,
  BookHeart,
  Brain,
  Sparkles,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import BookCard from "../../components/books/BookCard";

import { obtenerLibros } from "../../services/catalogo";
import { listarCategorias } from "../../services/catalogoApi";

const estilosCategorias = [
  {
    palabras: ["ciencia ficción", "ciencia ficcion"],
    icono: Rocket,
    fondo: "bg-violet-100",
    color: "text-violet-700",
  },
  {
    palabras: ["desarrollo personal"],
    icono: Sprout,
    fondo: "bg-emerald-100",
    color: "text-emerald-700",
  },
  {
    palabras: ["fantasía", "fantasia"],
    icono: WandSparkles,
    fondo: "bg-amber-100",
    color: "text-amber-700",
  },
  {
    palabras: ["filosofía", "filosofia", "ensayo"],
    icono: Feather,
    fondo: "bg-sky-100",
    color: "text-sky-700",
  },
  {
    palabras: ["historia"],
    icono: Landmark,
    fondo: "bg-orange-100",
    color: "text-orange-700",
  },
  {
    palabras: ["infantil", "juvenil"],
    icono: Heart,
    fondo: "bg-pink-100",
    color: "text-pink-700",
  },
  {
    palabras: ["poesía", "poesia"],
    icono: ScrollText,
    fondo: "bg-fuchsia-100",
    color: "text-fuchsia-700",
  },
  {
    palabras: ["novela"],
    icono: BookHeart,
    fondo: "bg-rose-100",
    color: "text-rose-700",
  },
  {
    palabras: ["no ficción", "no ficcion"],
    icono: Brain,
    fondo: "bg-teal-100",
    color: "text-teal-700",
  },
  {
    palabras: ["ficción", "ficcion"],
    icono: BookOpen,
    fondo: "bg-indigo-100",
    color: "text-indigo-700",
  },
];

function obtenerEstiloCategoria(nombre = "") {
  const texto = String(nombre).toLocaleLowerCase("es");

  return (
    estilosCategorias.find(({ palabras }) =>
      palabras.some((palabra) => texto.includes(palabra))
    ) || {
      icono: Sparkles,
      fondo: "bg-stone-100",
      color: "text-stone-700",
    }
  );
}

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [categoriasApi, setCategoriasApi] = useState([]);

  const [cargandoLibros, setCargandoLibros] = useState(true);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  const [errorLibros, setErrorLibros] = useState("");
  const [errorCategorias, setErrorCategorias] = useState("");

  // Cargar libros destacados desde el catálogo.
  useEffect(() => {
    let cancelado = false;

    async function cargarLibros() {
      try {
        setCargandoLibros(true);
        setErrorLibros("");

        const resultado = await obtenerLibros();

        if (!cancelado) {
          setBooks(Array.isArray(resultado) ? resultado : []);
        }
      } catch (error) {
        if (!cancelado) {
          setBooks([]);

          setErrorLibros(
              error.response?.data?.mensaje ||
              "No se pudieron cargar los libros."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoLibros(false);
        }
      }
    }

    cargarLibros();

    return () => {
      cancelado = true;
    };
  }, []);

  // Cargar categorías desde Spring Boot.
  useEffect(() => {
    let cancelado = false;

    async function cargarCategorias() {
      try {
        setCargandoCategorias(true);
        setErrorCategorias("");

        const resultado = await listarCategorias();

        if (!cancelado) {
          setCategoriasApi(
              Array.isArray(resultado) ? resultado : []
          );
        }
      } catch (error) {
        if (!cancelado) {
          setCategoriasApi([]);

          setErrorCategorias(
              error.response?.data?.mensaje ||
              "No se pudieron cargar las categorías."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoCategorias(false);
        }
      }
    }

    cargarCategorias();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main>
          {/* HERO */}
          <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
            <div className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] border border-[#E5DFE9] bg-gradient-to-br from-[#F0EDF5] via-[#EAEDE7] to-[#E2EBE5] px-8 py-12 shadow-sm md:grid-cols-2 md:px-14 md:py-16">
              <div>
              <span className="inline-block rounded-full border border-[#DDD3E7] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#563879] shadow-sm">
                Tu espacio para descubrir
              </span>

                <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-800 md:text-6xl">
                  Un mundo de historias
                  <span className="bg-gradient-to-r from-[#563879] to-[#3D7669] bg-clip-text text-transparent">
  {" "}te espera.
</span>
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
                  Descubre nuevos libros, encuentra tus autores favoritos
                  y disfruta de una experiencia de lectura a tu manera.
                  Compra o solicita préstamos desde un solo lugar.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                      to="/catalogo"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white transition hover:bg-[#315e55]"
                  >
                    Explorar catálogo
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                      to="/mis-prestamos"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#3D7669] px-6 py-3 font-semibold text-[#3D7669] transition hover:bg-white"
                  >
                    <BookOpen size={18} />
                    Mis préstamos
                  </Link>
                </div>
              </div>

              <div className="relative flex min-h-72 items-center justify-center">
                <div className="absolute h-64 w-64 rounded-full bg-[#D5E1D6] blur-2xl" />

                <div className="relative grid grid-cols-3 items-end gap-3">
                  {books.slice(0, 3).map((book, index) => (
                      <img
                          key={book.id}
                          src={book.image || "/placeholder-book.svg"}
                          alt={book.title}
                          className={`w-28 rounded-xl object-contain shadow-xl shadow-[#38244D]/20 transition-transform duration-500 hover:scale-105 md:w-36 ${
    index === 1 ? "-translate-y-8" : ""
}`}
                      />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* BENEFICIOS */}
          <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Compra fácilmente",
                text: "Encuentra y solicita tus libros favoritos.",
              },
              {
                icon: LibraryBig,
                title: "Préstamos de libros",
                text: "Consulta ejemplares disponibles para lectura.",
              },
              {
                icon: ShieldCheck,
                title: "Tu cuenta personal",
                text: "Gestiona tus pedidos y préstamos en un solo lugar.",
              },
            ].map(({ icon: Icon, title, text }) => (
                <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <div className="rounded-xl bg-[#E8EDE5] p-3 text-[#3D7669]">
                    <Icon size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {text}
                    </p>
                  </div>
                </div>
            ))}
          </section>

          {/* CATEGORÍAS */}
          <section className="mx-auto max-w-7xl px-5 py-14">
            <h2 className="text-3xl font-bold text-slate-800">
              Explora por categoría
            </h2>

            <p className="mt-2 text-slate-500">
              Siempre hay una lectura para cada interés.
            </p>

            {cargandoCategorias && (
                <p className="mt-7 text-sm text-slate-500">
                  Cargando categorías...
                </p>
            )}

            {errorCategorias && (
                <p
                    role="alert"
                    className="mt-7 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {errorCategorias}
                </p>
            )}

            {!cargandoCategorias &&
                !errorCategorias &&
                categoriasApi.length === 0 && (
                    <p className="mt-7 text-sm text-slate-500">
                      No hay categorías disponibles actualmente.
                    </p>
                )}

            {!cargandoCategorias &&
                !errorCategorias &&
                categoriasApi.length > 0 && (
                    <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                      
{categoriasApi.map((categoria) => {
  const estilo = obtenerEstiloCategoria(categoria.name);
  const Icono = estilo.icono;

  return (
    <Link
      key={categoria.id}
      to={`/catalogo?categoria=${encodeURIComponent(categoria.name)}`}
      className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5"
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${estilo.fondo} ${estilo.color} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icono size={29} strokeWidth={1.7} />
      </div>

      <span className="text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#3D7669]">
        {categoria.name}
      </span>
    </Link>
  );
})}

                    </div>
                )}
          </section>

          {/* LIBROS DESTACADOS */}
          <section className="bg-white/60 py-14">
            <div className="mx-auto max-w-7xl px-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-4">
  <div className="h-9 w-1.5 rounded-full bg-[#3D7669]" />
  <h2 className="text-3xl font-bold tracking-tight text-slate-800">
    Explora por categoría
  </h2>
</div>
                  <p className="mt-2 text-slate-500">
                    Descubre algunas lecturas que tenemos para ti.
                  </p>
                </div>

                <Link
                    to="/catalogo"
                    className="flex items-center gap-2 font-semibold text-[#3D7669]"
                >
                  Ver catálogo
                  <ArrowRight size={18} />
                </Link>
              </div>

              {cargandoLibros && (
                  <p className="mt-8 text-sm text-slate-500">
                    Cargando libros...
                  </p>
              )}

              {errorLibros && (
                  <p
                      role="alert"
                      className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  >
                    {errorLibros}
                  </p>
              )}

              {!cargandoLibros &&
                  !errorLibros &&
                  books.length === 0 && (
                      <p className="mt-8 text-sm text-slate-500">
                        No hay libros disponibles actualmente.
                      </p>
                  )}

              {!cargandoLibros &&
                  !errorLibros &&
                  books.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {books.slice(0, 8).map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                  )}
            </div>
          </section>

          

{/* PRÉSTAMOS */}
<section className="mx-auto max-w-7xl px-5 py-14 md:py-20">
  <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#302346] via-[#3C3155] to-[#254E46] px-8 py-12 text-white shadow-xl shadow-violet-950/10 md:px-14 md:py-16">

    {/* Decoración */}
    <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-violet-300/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />

    <div className="relative z-10 max-w-2xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#E8D7FF]">
        <LibraryBig size={16} />
        Biblioteca y préstamos
      </span>

      <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
        Cada libro merece
        <span className="block text-[#DCC7FA]">
          ser descubierto.
        </span>
      </h2>

      <p className="mt-5 max-w-xl text-base leading-8 text-white/75">
        Explora nuestra colección y encuentra nuevas historias.
        Consulta los ejemplares disponibles y gestiona tus
        préstamos desde un solo lugar.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#302346] transition hover:-translate-y-0.5 hover:bg-[#F2EAFB]"
        >
          Explorar catálogo
          <ArrowRight size={18} />
        </Link>

        <Link
          to="/mis-prestamos"
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
        >
          <BookOpen size={18} />
          Mis préstamos
        </Link>
      </div>
    </div>

    <BookOpen
      size={260}
      strokeWidth={0.7}
      className="pointer-events-none absolute -bottom-12 -right-8 hidden rotate-[-15deg] text-white/10 lg:block"
    />
  </div>
</section>


        </main>

        
<footer className="border-t border-[#E7E1E9] bg-[#F3F0F4]">
  <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3">

    {/* IDENTIDAD */}
    <div>
      <Link to="/" className="inline-flex items-center gap-3">
        <img
          src="/BiblioNova.png"
          alt="Logo BiblioNova"
          className="h-16 w-16 object-contain"
        />
        <span className="text-xl font-bold text-[#352747]">
          Biblio<span className="text-[#6D4C91]">Nova</span>
        </span>
      </Link>

      <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
        Tu espacio para descubrir historias, explorar libros
        y disfrutar de nuevas experiencias de lectura.
      </p>
    </div>

    {/* NAVEGACIÓN */}
    <div>
      <h3 className="font-bold text-[#352747]">
        Explorar
      </h3>

      <div className="mt-5 flex flex-col items-start gap-3 text-sm text-slate-600">
        <Link to="/" className="hover:text-[#6D4C91]">
          Inicio
        </Link>

        <Link to="/catalogo" className="hover:text-[#6D4C91]">
          Catálogo de libros
        </Link>
      </div>
    </div>

    {/* BIBLIOTECA */}
    <div>
      <h3 className="font-bold text-[#352747]">
        BiblioNova
      </h3>

      <p className="mt-5 text-sm leading-7 text-slate-600">
        Librería y biblioteca digital.
        Consulta nuestro catálogo y descubre
        los libros disponibles para compra o préstamo.
      </p>
    </div>
  </div>

  <div className="border-t border-[#E2DCE5] px-5 py-5 text-center text-xs text-slate-500">
    © {new Date().getFullYear()} BiblioNova.
    Todos los derechos reservados.
  </div>
</footer>

      </div>
  );
}