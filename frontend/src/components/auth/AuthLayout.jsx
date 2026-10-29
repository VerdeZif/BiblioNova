
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

const featuredBooks = [
  {
    title: "El Principito",
    author: "Antoine de Saint-Exupéry",
    image: "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
  },
  {
    title: "Orgullo y prejuicio",
    author: "Jane Austen",
    image: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
  },
  {
    title: "1984",
    author: "George Orwell",
    image: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
  },
];

export default function AuthLayout({
  children,
  title,
  subtitle,
}) {
  return (
    <div className="min-h-screen bg-[#F8F6F1] lg:grid lg:grid-cols-2">
      {/* PANEL VISUAL IZQUIERDO */}
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#E5EDE7] lg:flex lg:flex-col">
        {/* Decoración */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#C8DED1]/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#BFD9CB]/70 blur-3xl" />

        {/* Marca */}
        <Link
          to="/"
          className="relative z-10 flex items-center gap-3 px-12 pt-10"
        >
          <span className="rounded-xl bg-[#3D7669] p-3 text-white">
            <BookOpen size={25} />
          </span>
          <span className="text-2xl font-bold text-slate-800">
            Biblio<span className="text-[#3D7669]">Nova</span>
          </span>
        </Link>

        {/* Composición central */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div className="relative w-full max-w-[480px]">
            {/* Tarjeta decorativa superior */}
            <div className="absolute -top-8 right-2 z-20 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-[#254E46]/10">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
                <Star size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tu próxima lectura</p>
                <p className="text-sm font-bold text-slate-800">
                  Te está esperando
                </p>
              </div>
            </div>

            {/* Tarjetas de libros */}
            <div className="grid grid-cols-3 items-center gap-3 pt-12">
              {featuredBooks.map((book, index) => (
                <div
                  key={book.title}
                  className={`rounded-2xl border border-white/70 bg-white/90 p-2 shadow-xl shadow-[#254E46]/10 ${
                    index === 0
                      ? "-rotate-12 translate-y-5"
                      : index === 2
                        ? "rotate-12 translate-y-5"
                        : "relative z-10 -translate-y-3"
                  }`}
                >
                  <img
                    src={book.image}
                    alt={`Portada de ${book.title}`}
                    className="aspect-[2/3] w-full rounded-xl bg-stone-100 object-cover"
                  />
                  <div className="px-1 pb-2 pt-3">
                    <p className="line-clamp-2 text-xs font-bold text-slate-800">
                      {book.title}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-500">
                      {book.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tarjeta flotante inferior */}
            <div className="relative z-20 mx-auto mt-3 flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-[#254E46]/10">
              <span className="rounded-xl bg-emerald-50 p-2 text-[#3D7669]">
                <Heart size={21} fill="currentColor" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Historias para todos
                </p>
                <p className="text-xs text-slate-500">
                  Explora tu próxima aventura
                </p>
              </div>
              <Sparkles size={20} className="text-amber-500" />
            </div>
          </div>

          <div className="mt-14 max-w-md text-center">
            <h2 className="text-4xl font-bold leading-tight text-[#254E46]">
              Un mundo de historias
              <br />
              a tu alcance.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#60776C]">
              Descubre libros que inspiran, compra tus favoritos
              y disfruta de una biblioteca hecha para ti.
            </p>
          </div>
        </div>

        {/* Pie del panel */}
        <div className="relative z-10 flex items-center justify-between px-12 pb-9 text-xs text-[#60776C]">
          <span>© {new Date().getFullYear()} BiblioNova</span>
          <span className="flex items-center gap-2">
            <ShoppingBag size={15} />
            Librería y biblioteca
          </span>
        </div>
      </aside>

      {/* PANEL DERECHO */}
      <main className="flex min-h-screen flex-col bg-white px-6 py-7 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#3D7669]"
          >
            <ArrowLeft size={17} />
            Volver a la tienda
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-[#3D7669] lg:hidden"
          >
            <BookOpen size={21} />
            BiblioNova
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <div className="mb-9">
            <span className="mb-4 inline-block rounded-full bg-[#E5EDE7] px-4 py-2 text-xs font-semibold text-[#3D7669]">
              Bienvenido a BiblioNova
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        <p className="text-center text-xs text-slate-400">
          BiblioNova · Tu espacio para descubrir historias
        </p>
      </main>
    </div>
  );
}
