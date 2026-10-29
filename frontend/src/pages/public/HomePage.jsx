import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ShieldCheck, Truck, LibraryBig } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import BookCard from "../../components/books/BookCard";

import { books } from "../../data/books";

const categories = [
  { name: "Literatura", emoji: "📖" },
  { name: "Ciencia", emoji: "🔬" },
  { name: "Tecnología", emoji: "💻" },
  { name: "Historia", emoji: "🏛️" },
  { name: "Infantil", emoji: "🧸" },
  { name: "Negocios", emoji: "💼" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
          <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-[#E8EDE5] px-8 py-12 md:grid-cols-2 md:px-14 md:py-16">
            <div>
              <span className="inline-block rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#3D7669]">
                Tu espacio para descubrir
              </span>

              <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-800 md:text-6xl">
                Un mundo de historias
                <span className="text-[#3D7669]"> te espera.</span>
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
                  Explorar catálogo <ArrowRight size={18} />
                </Link>

                <Link
                  to="/mis-prestamos"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3D7669] px-6 py-3 font-semibold text-[#3D7669] transition hover:bg-white"
                >
                  <BookOpen size={18} /> Mis préstamos
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-72 items-center justify-center">
              <div className="absolute h-64 w-64 rounded-full bg-[#D5E1D6] blur-2xl" />
              <div className="relative grid grid-cols-3 items-end gap-3">
                {books.slice(0, 3).map((book, index) => (
                  <img
                    key={book.id}
                    src={book.image}
                    alt={book.title}
                    className={`w-28 rounded-lg object-contain shadow-xl md:w-36 ${
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
            { icon: Truck, title: "Compra fácilmente", text: "Encuentra y solicita tus libros favoritos." },
            { icon: LibraryBig, title: "Préstamos de libros", text: "Consulta ejemplares disponibles para lectura." },
            { icon: ShieldCheck, title: "Tu cuenta personal", text: "Gestiona tus pedidos y préstamos en un solo lugar." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5">
              <div className="rounded-xl bg-[#E8EDE5] p-3 text-[#3D7669]">
                <Icon size={23} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
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

          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to="/catalogo"
                className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-4xl">{category.emoji}</span>
                <span className="text-sm font-semibold text-slate-700">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* LIBROS DESTACADOS */}
        <section className="bg-white/60 py-14">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  Libros destacados
                </h2>
                <p className="mt-2 text-slate-500">
                  Descubre algunas lecturas que tenemos para ti.
                </p>
              </div>
              <Link to="/catalogo" className="flex items-center gap-2 font-semibold text-[#3D7669]">
                Ver catálogo <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        {/* PRÉSTAMOS */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="rounded-[2rem] bg-[#254E46] p-9 text-white md:p-14">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-widest text-emerald-200">
                Biblioteca y préstamos
              </span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                No necesitas comprar cada historia para disfrutarla.
              </h2>
              <p className="mt-4 leading-7 text-emerald-50/80">
                Regístrate, explora los ejemplares disponibles y consulta
                tus préstamos desde tu cuenta personal.
              </p>
              <Link
                to="/registro"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#254E46]"
              >
                Crear mi cuenta <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BiblioNova — Sistema de Gestión de Biblioteca.
      </footer>
    </div>
  );
}
