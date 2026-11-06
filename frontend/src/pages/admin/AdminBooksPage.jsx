import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Power,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";

import {
  listarLibrosGestion,
  listarCategoriasAdmin,
  listarEditorialesAdmin,
  listarAutoresAdmin,
  crearLibro,
  actualizarLibro,
  cambiarEstadoLibro,
} from "../../services/catalogoAdmin";

const formularioInicial = {
  isbn: "",
  titulo: "",
  categoriaId: "",
  editorialId: "",
  anioPublicacion: "",
  edicion: "",
  descripcion: "",
  imagenPortada: "",
  precioVenta: "",
  prestamoHabilitado: false,
  ventaHabilitada: true,
  autorIds: [],
};

// Normalizar ISBN (solo dígitos y 'X').
function normalizarISBN(valor) {
  return String(valor ?? "")
      .toUpperCase()
      .replace(/[^0-9X]/g, "");
}

// Validar ISBN-10 e ISBN-13 con dígito de control.
function validarISBN(valor) {
  const isbn = normalizarISBN(valor);

  // ISBN-13
  if (/^\d{13}$/.test(isbn)) {
    const suma = isbn
        .slice(0, 12)
        .split("")
        .reduce(
            (total, digito, index) =>
                total + Number(digito) * (index % 2 === 0 ? 1 : 3),
            0
        );

    const verificador = (10 - (suma % 10)) % 10;

    return verificador === Number(isbn[12]);
  }

  // ISBN-10
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const suma =
        isbn
            .slice(0, 9)
            .split("")
            .reduce(
                (total, digito, index) => total + Number(digito) * (10 - index),
                0
            ) + (isbn[9] === "X" ? 10 : Number(isbn[9]));

    return suma % 11 === 0;
  }

  return false;
}

// Obtener el identificador de una opción del catálogo.
function obtenerIdOpcion(item) {
  return (
      item?.autorId ??
      item?.categoriaId ??
      item?.editorialId ??
      item?.id ??
      null
  );
}

// Normalizar una opción para los selectores.
function adaptarOpcion(item) {
  const nombre =
      item?.nombre ??
      item?.nombreCompleto ??
      item?.nombreAutor ??
      [item?.nombres, item?.apellidos].filter(Boolean).join(" ") ??
      item?.titulo ??
      "";

  return {
    ...item,
    id: Number(obtenerIdOpcion(item)),
    nombre: String(nombre).trim(),
  };
}

// Adaptar la respuesta del backend al formato administrativo.
function adaptarLibroAdmin(libro) {
  const stock = libro.stock ?? {};

  const autores = Array.isArray(libro.autores) ? libro.autores : [];

  return {
    ...libro,

    id: libro.libroId ?? libro.id,
    title: libro.titulo ?? "",
    author: autores
        .map((autor) => autor.nombre)
        .filter(Boolean)
        .join(", "),

    category: libro.categoria?.nombre ?? "",
    editorial: libro.editorial?.nombre ?? "",

    categoryId:
        libro.categoria?.categoriaId ??
        libro.categoria?.id ??
        libro.categoriaId ??
        "",

    editorialId:
        libro.editorial?.editorialId ??
        libro.editorial?.id ??
        libro.editorialId ??
        "",

    authorIds: autores
        .map((autor) => autor.autorId ?? autor.id)
        .filter((id) => id !== null && id !== undefined)
        .map(Number),

    price: Number(libro.precioVenta ?? 0),
    image: libro.imagenPortada || "/placeholder-book.svg",

    stockVenta: Number(stock.disponiblesVenta ?? 0),
    stockPrestamo: Number(stock.disponiblesPrestamo ?? 0),
    enInventario: Number(stock.enInventario ?? 0),

    activo: libro.activo !== false,
  };
}

// Construir el DTO exacto que espera Spring Boot.
function construirDatosLibro(formulario) {
  const isbn = normalizarISBN(formulario.isbn);

  return {
    isbn,
    titulo: formulario.titulo.trim(),
    categoriaId: Number(formulario.categoriaId),
    editorialId: Number(formulario.editorialId),
    anioPublicacion: Number(formulario.anioPublicacion),
    edicion: formulario.edicion.trim(),
    descripcion: formulario.descripcion.trim(),
    imagenPortada: formulario.imagenPortada.trim(),
    precioVenta: Number(formulario.precioVenta),
    prestamoHabilitado: formulario.prestamoHabilitado,
    ventaHabilitada: formulario.ventaHabilitada,
    autorIds: [...new Set(formulario.autorIds.map(Number))],
  };
}

// Validaciones del formulario.
function validarFormulario(formulario) {
  const titulo = formulario.titulo.trim();
  const isbn = formulario.isbn.trim();
  const precio = Number(formulario.precioVenta);
  const anio = Number(formulario.anioPublicacion);
  const autores = formulario.autorIds.map(Number);
  const anioMaximo = new Date().getFullYear() + 1;

  if (isbn.length === 0) {
    return "El ISBN es obligatorio.";
  }

  if (!validarISBN(isbn)) {
    return "El ISBN debe ser válido y tener 10 o 13 dígitos.";
  }

  if (titulo.length < 2 || titulo.length > 180) {
    return "El título debe tener entre 2 y 180 caracteres.";
  }

  if (!Number.isFinite(precio) || precio < 0) {
    return "El precio debe ser un número mayor o igual a cero.";
  }

  if (formulario.ventaHabilitada && precio <= 0) {
    return "Un libro habilitado para venta debe tener un precio mayor que cero.";
  }

  if (!Number.isInteger(anio) || anio < 1000 || anio > anioMaximo) {
    return `El año debe estar entre 1000 y ${anioMaximo}.`;
  }

  if (
      !Number.isInteger(Number(formulario.categoriaId)) ||
      Number(formulario.categoriaId) <= 0
  ) {
    return "Selecciona una categoría válida.";
  }

  if (
      !Number.isInteger(Number(formulario.editorialId)) ||
      Number(formulario.editorialId) <= 0
  ) {
    return "Selecciona una editorial válida.";
  }

  if (
      autores.length === 0 ||
      autores.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    return "Selecciona al menos un autor válido.";
  }

  if (formulario.edicion.trim().length > 50) {
    return "La edición no puede superar los 50 caracteres.";
  }

  if (formulario.descripcion.trim().length > 2000) {
    return "La descripción no puede superar los 2000 caracteres.";
  }

  const imagen = formulario.imagenPortada.trim();

  if (imagen) {
    const esRutaLocal = imagen.startsWith("/") && !imagen.startsWith("//");

    let esUrlWeb = false;

    try {
      const url = new URL(imagen);
      esUrlWeb = url.protocol === "http:" || url.protocol === "https:";
    } catch {
      esUrlWeb = false;
    }

    if (!esRutaLocal && !esUrlWeb) {
      return "La portada debe ser una URL HTTP/HTTPS o una ruta local válida.";
    }
  }

  return "";
}

export default function AdminBooksPage() {
  const [libros, setLibros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [autores, setAutores] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editando, setEditando] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Cargar datos independientes con Promise.allSettled
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");

    const resultados = await Promise.allSettled([
      listarLibrosGestion(),
      listarCategoriasAdmin(),
      listarEditorialesAdmin(),
      listarAutoresAdmin(),
    ]);

    const [
      librosResultado,
      categoriasResultado,
      editorialesResultado,
      autoresResultado,
    ] = resultados;

    const errores = [];

    if (librosResultado.status === "fulfilled") {
      setLibros(librosResultado.value.map(adaptarLibroAdmin));
    } else {
      setLibros([]);
      errores.push("No se pudieron cargar los libros.");
    }

    if (categoriasResultado.status === "fulfilled") {
      setCategorias(categoriasResultado.value.map(adaptarOpcion));
    } else {
      setCategorias([]);
      errores.push("No se pudieron cargar las categorías.");
    }

    if (editorialesResultado.status === "fulfilled") {
      setEditoriales(editorialesResultado.value.map(adaptarOpcion));
    } else {
      setEditoriales([]);
      errores.push("No se pudieron cargar las editoriales.");
    }

    if (autoresResultado.status === "fulfilled") {
      const autoresAdaptados = autoresResultado.value
          .map(adaptarOpcion)
          .filter(
              (autor) =>
                  Number.isInteger(autor.id) &&
                  autor.id > 0 &&
                  autor.nombre.length > 0
          );

      setAutores(autoresAdaptados);

      if (autoresAdaptados.length === 0) {
        errores.push(
            "El servidor respondió, pero no se encontraron autores válidos."
        );
      }
    } else {
      setAutores([]);
      errores.push("No se pudieron cargar los autores.");
    }

    if (errores.length > 0) {
      setError(errores.join(" "));
    }

    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Búsqueda local entre los datos obtenidos del backend.
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    return libros.filter((libro) => {
      const contenido = [
        libro.title,
        libro.author,
        libro.category,
        libro.editorial,
        libro.isbn,
      ]
          .join(" ")
          .toLocaleLowerCase("es");

      return contenido.includes(texto);
    });
  }, [libros, busqueda]);

  // Estadísticas de libros reales.
  const estadisticas = useMemo(
      () => [
        ["Total libros", libros.length],
        ["Libros activos", libros.filter((l) => l.activo).length],
        [
          "Disponibles para venta",
          libros.filter((l) => l.activo && l.ventaHabilitada && l.stockVenta > 0)
              .length,
        ],
        [
          "Disponibles para préstamo",
          libros.filter(
              (l) => l.activo && l.prestamoHabilitado && l.stockPrestamo > 0
          ).length,
        ],
      ],
      [libros]
  );

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setError("");
  };

  const abrirNuevo = () => {
    setFormulario({ ...formularioInicial });
    setEditando(null);
    setError("");
    setMensaje("");
    setModalAbierto(true);
  };

  const abrirEditar = (libro) => {
    setFormulario({
      isbn: libro.isbn ?? "",
      titulo: libro.title ?? "",
      categoriaId: String(libro.categoryId ?? ""),
      editorialId: String(libro.editorialId ?? ""),
      anioPublicacion: String(libro.anioPublicacion ?? ""),
      edicion: libro.edicion ?? "",
      descripcion: libro.descripcion ?? "",
      imagenPortada: libro.imagenPortada ?? "",
      precioVenta: String(libro.price ?? ""),
      prestamoHabilitado: Boolean(libro.prestamoHabilitado),
      ventaHabilitada: Boolean(libro.ventaHabilitada),
      autorIds: libro.authorIds ?? [],
    });

    setEditando(libro.id);
    setError("");
    setMensaje("");
    setModalAbierto(true);
  };

  // Registrar o actualizar.
  const guardar = async (event) => {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (guardando) return;

    const errorValidacion = validarFormulario(formulario);

    const isbnNormalizado = normalizarISBN(formulario.isbn);

    const isbnDuplicado = libros.some((libro) => {
      const isbnExistente = normalizarISBN(libro.isbn);

      return (
          isbnExistente === isbnNormalizado &&
          String(libro.id) !== String(editando)
      );
    });

    if (isbnDuplicado) {
      setError("Ya existe un libro registrado con ese ISBN.");
      return;
    }

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const datos = construirDatosLibro(formulario);

    try {
      setGuardando(true);

      if (editando !== null) {
        await actualizarLibro(editando, datos);
        setMensaje("El libro se actualizó correctamente.");
      } else {
        await crearLibro(datos);
        setMensaje("El libro se registró correctamente.");
      }

      setModalAbierto(false);
      setFormulario({ ...formularioInicial });
      setEditando(null);

      await cargarDatos();
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo guardar el libro."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Activar o desactivar, sin eliminar físicamente.
  const cambiarEstado = async (libro) => {
    const nuevoEstado = !libro.activo;

    const mensajeConfirmacion = nuevoEstado
        ? `¿Activar nuevamente "${libro.title}"?`
        : `¿Desactivar "${libro.title}" del catálogo?`;

    if (!window.confirm(mensajeConfirmacion)) {
      return;
    }

    try {
      setCambiandoEstado(libro.id);
      setError("");
      setMensaje("");

      await cambiarEstadoLibro(libro.id, nuevoEstado);

      setMensaje(
          nuevoEstado
              ? "El libro se activó correctamente."
              : "El libro se desactivó correctamente."
      );

      await cargarDatos();
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo cambiar el estado del libro."
      );
    } finally {
      setCambiandoEstado(null);
    }
  };

  return (
      <main className="mx-auto max-w-7xl p-6 md:p-10">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#3D7669]">Administración</p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Gestión de libros
            </h1>

            <p className="mt-2 text-slate-500">
              Administra los libros registrados en BiblioNova.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
                type="button"
                onClick={cargarDatos}
                disabled={cargando}
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 font-semibold text-slate-600 disabled:opacity-50"
            >
              <RefreshCw
                  size={18}
                  className={cargando ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            <button
                type="button"
                onClick={abrirNuevo}
                disabled={
                    categorias.length === 0 ||
                    editoriales.length === 0 ||
                    autores.length === 0
                }
                className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={19} />
              Nuevo libro
            </button>
          </div>
        </div>

        {/* MENSAJES */}
        {error && (
            <div
                role="alert"
                className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
        )}

        {mensaje && (
            <div
                role="status"
                className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {mensaje}
            </div>
        )}

        {/* ESTADÍSTICAS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {estadisticas.map(([titulo, valor]) => (
              <div key={titulo} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{titulo}</p>

                <p className="mt-2 text-3xl font-bold text-[#3D7669]">{valor}</p>
              </div>
          ))}
        </div>

        {/* TABLA */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <Search size={19} className="text-slate-400" />

            <input
                type="search"
                maxLength={100}
                value={busqueda}
                onChange={(event) =>
                    setBusqueda(event.target.value.slice(0, 100))
                }
                placeholder="Buscar por título, ISBN, autor o categoría..."
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
                <th className="pb-4">Estado</th>
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
                            {libro.author || "Sin autor"}
                          </p>

                          <p className="text-xs text-slate-400">
                            ISBN: {libro.isbn}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">{libro.category || "Sin categoría"}</td>

                    <td className="py-4 whitespace-nowrap">
                      S/ {libro.price.toFixed(2)}
                    </td>

                    <td className="py-4">{libro.stockVenta}</td>

                    <td className="py-4">{libro.stockPrestamo}</td>

                    <td className="py-4">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            libro.activo
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                      {libro.activo ? "Activo" : "Inactivo"}
                    </span>
                    </td>

                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => abrirEditar(libro)}
                            aria-label={`Editar ${libro.title}`}
                            disabled={!libro.activo}
                            className="rounded-lg p-2 text-[#3D7669] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => cambiarEstado(libro)}
                            disabled={cambiandoEstado === libro.id}
                            aria-label={
                              libro.activo
                                  ? `Desactivar ${libro.title}`
                                  : `Activar ${libro.title}`
                            }
                            title={
                              libro.activo ? "Desactivar libro" : "Activar libro"
                            }
                            className={`rounded-lg p-2 disabled:opacity-40 ${
                                libro.activo
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-emerald-700 hover:bg-emerald-50"
                            }`}
                        >
                          {libro.activo ? (
                              <Power size={18} />
                          ) : (
                              <CheckCircle2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>

            {cargando && (
                <p className="py-10 text-center text-slate-500">
                  Cargando libros desde el servidor...
                </p>
            )}

            {!cargando && !error && filtrados.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  No se encontraron libros.
                </p>
            )}
          </div>
        </div>

        {/* MODAL DE CREACIÓN Y EDICIÓN */}
        {modalAbierto && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={editando !== null ? "Editar libro" : "Nuevo libro"}
                  className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {editando !== null ? "Editar libro" : "Registrar libro"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Completa los datos bibliográficos del libro.
                    </p>
                  </div>

                  <button
                      type="button"
                      onClick={() => setModalAbierto(false)}
                      disabled={guardando}
                      aria-label="Cerrar formulario"
                  >
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={guardar} className="mt-6 space-y-5">
                  {/* DATOS PRINCIPALES */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Título *
                  </span>

                      <input
                          type="text"
                          value={formulario.titulo}
                          onChange={(e) => actualizarCampo("titulo", e.target.value)}
                          maxLength={180}
                          required
                          placeholder="Título del libro"
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                      />
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    ISBN *
                  </span>

                      <input
                          type="text"
                          value={formulario.isbn}
                          onChange={(e) =>
                              actualizarCampo("isbn", e.target.value.slice(0, 20))
                          }
                          maxLength={20}
                          required
                          placeholder="978-..."
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                      />
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Precio de venta *
                  </span>

                      <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formulario.precioVenta}
                          onChange={(e) =>
                              actualizarCampo("precioVenta", e.target.value)
                          }
                          required
                          placeholder="0.00"
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                      />
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Año de publicación *
                  </span>

                      <input
                          type="number"
                          min="1000"
                          max={new Date().getFullYear() + 1}
                          step="1"
                          value={formulario.anioPublicacion}
                          onChange={(e) =>
                              actualizarCampo("anioPublicacion", e.target.value)
                          }
                          required
                          placeholder="2026"
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                      />
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Edición
                  </span>

                      <input
                          type="text"
                          maxLength={50}
                          value={formulario.edicion}
                          onChange={(e) => actualizarCampo("edicion", e.target.value)}
                          placeholder="Primera edición"
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                      />
                    </label>
                  </div>

                  {/* RELACIONES */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Categoría *
                  </span>

                      <select
                          value={formulario.categoriaId}
                          onChange={(e) =>
                              actualizarCampo("categoriaId", e.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[#3D7669]"
                      >
                        <option value="">Selecciona una categoría</option>

                        {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Editorial *
                  </span>

                      <select
                          value={formulario.editorialId}
                          onChange={(e) =>
                              actualizarCampo("editorialId", e.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[#3D7669]"
                      >
                        <option value="">Selecciona una editorial</option>

                        {editoriales.map((editorial) => (
                            <option key={editorial.id} value={editorial.id}>
                              {editorial.nombre}
                            </option>
                        ))}
                      </select>
                    </label>

                    {/* AUTORES */}
                    <div className="block sm:col-span-2">
  <span className="mb-2 block text-sm font-medium text-slate-700">
    Autores *
  </span>

                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {autores.map((autor) => {
                            const seleccionado = formulario.autorIds.includes(autor.id);

                            return (
                                <label
                                    key={autor.id}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                                        seleccionado
                                            ? "bg-[#F0F7F4] text-[#254E46] font-semibold"
                                            : "hover:bg-stone-50 text-slate-700"
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={seleccionado}
                                        onChange={(e) => {
                                          const nuevosIds = e.target.checked
                                              ? [...formulario.autorIds, autor.id]
                                              : formulario.autorIds.filter((id) => id !== autor.id);

                                          actualizarCampo("autorIds", nuevosIds);
                                        }}
                                        className="h-4 w-4 rounded accent-[#3D7669]"
                                    />
                                    <span>{autor.nombre}</span>
                                  </div>
                                  {seleccionado && (
                                      <span className="text-xs font-medium text-[#3D7669]">
                Seleccionado
              </span>
                                  )}
                                </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* ETIQUETAS DE AUTORES SELECCIONADOS */}
                      {formulario.autorIds.length > 0 ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {formulario.autorIds.map((id) => {
                              const autor = autores.find((a) => a.id === id);
                              if (!autor) return null;

                              return (
                                  <span
                                      key={id}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-[#E8EDE5] px-3 py-1 text-xs font-semibold text-[#3D7669]"
                                  >
            {autor.nombre}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            actualizarCampo(
                                                "autorIds",
                                                formulario.autorIds.filter((item) => item !== id)
                                            )
                                        }
                                        className="ml-0.5 font-bold text-slate-400 hover:text-red-600"
                                        aria-label={`Quitar ${autor.nombre}`}
                                    >
              ×
            </button>
          </span>
                              );
                            })}
                          </div>
                      ) : (
                          <span className="mt-1 block text-xs text-slate-400">
      Selecciona al menos un autor para el libro.
    </span>
                      )}
                    </div>
                  </div>

                  {/* PORTADA */}
                  <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  URL o ruta de portada
                </span>

                    <input
                        type="text"
                        value={formulario.imagenPortada}
                        onChange={(e) =>
                            actualizarCampo("imagenPortada", e.target.value)
                        }
                        maxLength={500}
                        placeholder="https://... o /imagenes/libro.jpg"
                        className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                    />
                  </label>

                  {/* DESCRIPCIÓN */}
                  <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Descripción
                </span>

                    <textarea
                        rows={4}
                        maxLength={2000}
                        value={formulario.descripcion}
                        onChange={(e) =>
                            actualizarCampo("descripcion", e.target.value)
                        }
                        placeholder="Descripción o sinopsis del libro..."
                        className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#3D7669]"
                    />

                    <span className="mt-1 block text-right text-xs text-slate-400">
                  {formulario.descripcion.length}/2000 caracteres
                </span>
                  </label>

                  {/* DISPONIBILIDAD */}
                  <div className="rounded-xl bg-[#F8F6F1] p-4">
                    <h3 className="font-semibold text-slate-800">
                      Habilitación del libro
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={formulario.ventaHabilitada}
                            onChange={(e) =>
                                actualizarCampo("ventaHabilitada", e.target.checked)
                            }
                            className="h-4 w-4 accent-[#3D7669]"
                        />
                        Habilitado para venta
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={formulario.prestamoHabilitado}
                            onChange={(e) =>
                                actualizarCampo("prestamoHabilitado", e.target.checked)
                            }
                            className="h-4 w-4 accent-[#3D7669]"
                        />
                        Habilitado para préstamo
                      </label>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      El stock no se modifica desde este formulario. Para registrar
                      existencias debes utilizar la gestión de inventario.
                    </p>
                  </div>

                  {/* ERRORES */}
                  {error && (
                      <p
                          role="alert"
                          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                      >
                        {error}
                      </p>
                  )}

                  {/* BOTONES */}
                  <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                    <button
                        type="button"
                        onClick={() => setModalAbierto(false)}
                        disabled={guardando}
                        className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={guardando}
                        className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guardando && (
                          <RefreshCw size={17} className="animate-spin" />
                      )}

                      {guardando
                          ? "Guardando..."
                          : editando !== null
                              ? "Guardar cambios"
                              : "Registrar libro"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </main>
  );
}