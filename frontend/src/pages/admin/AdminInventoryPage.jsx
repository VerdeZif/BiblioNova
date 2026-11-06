import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  Package,
  AlertTriangle,
  Save,
  Plus,
  X,
  RefreshCw,
  Warehouse,
  ClipboardList,
  BookOpen,
  Trash2,
  Building2,
  MapPin,
  Pencil,
} from "lucide-react";

import { listarLibrosGestion } from "../../services/catalogoAdmin";

import {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  listarUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  listarRecepciones,
  registrarRecepcion,
  listarEjemplares,
  cambiarEstadoEjemplar,
} from "../../services/inventario";

// Línea inicial de una recepción.
function nuevaLinea() {
  return {
    libroId: "",
    cantidad: "1",
    costoUnitario: "0",
    ubicacionId: "",
    esVendible: true,
    esPrestamo: false,
    condicionFisica: "Nuevo",
    observaciones: "",
  };
}

// Adaptar los libros recibidos del backend.
function adaptarLibro(libro) {
  const stock = libro.stock ?? {};

  const autores = Array.isArray(libro.autores)
      ? libro.autores
      : [];

  return {
    id: Number(libro.libroId ?? libro.id),
    title: libro.titulo ?? libro.title ?? "",
    author: autores
        .map((autor) => autor.nombre)
        .filter(Boolean)
        .join(", "),
    isbn: libro.isbn ?? "",
    activo: libro.activo !== false,
    ventaHabilitada: Boolean(libro.ventaHabilitada),
    prestamoHabilitado: Boolean(libro.prestamoHabilitado),
    stockVenta: Number(stock.disponiblesVenta ?? 0),
    stockPrestamo: Number(stock.disponiblesPrestamo ?? 0),
    enInventario: Number(stock.enInventario ?? 0),
  };
}

// Adaptar proveedor usando los nombres exactos de su respuesta API.
function adaptarProveedor(item) {
  return {
    id: Number(item.proveedorId),
    razonSocial: item.razonSocial ?? "",
    nombre: item.razonSocial ?? "",
    documentoFiscal: item.documentoFiscal ?? "",
    contacto: item.contacto ?? "",
    correo: item.correo ?? "",
    telefono: item.telefono ?? "",
    direccion: item.direccion ?? "",
    activo: item.activo === true,
  };
}

// Adaptar ubicación usando los nombres exactos de su respuesta API.
function adaptarUbicacion(item) {
  const codigo = item.codigo ?? "";
  const descripcion = item.descripcion ?? "";

  return {
    id: Number(item.ubicacionId),
    codigo,
    descripcion,
    nombre: [codigo, descripcion].filter(Boolean).join(" · "),
    activa: item.activa === true,
    activo: item.activa === true,
  };
}

// Obtener fecha para mostrar en pantalla.
function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Extraer registros de una respuesta.
function extraerElementos(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.contenido)) return data.contenido;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

export default function AdminInventoryPage() {
  const [libros, setLibros] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [recepciones, setRecepciones] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);

  // Formularios de mantenimiento de proveedores y ubicaciones.
  const [modalMaestro, setModalMaestro] = useState(null);
  const [idMaestroEditando, setIdMaestroEditando] = useState(null);
  const [formProveedor, setFormProveedor] = useState({
    razonSocial: "",
    documentoFiscal: "",
    contacto: "",
    correo: "",
    telefono: "",
    direccion: "",
    activo: true,
  });
  const [formUbicacion, setFormUbicacion] = useState({
    codigo: "",
    descripcion: "",
    activa: true,
  });

  const [formRecepcion, setFormRecepcion] = useState({
    tipoOrigen: "Compra",
    proveedorId: "",
    donante: "",
    documentoReferencia: "",
    observaciones: "",
    lineas: [nuevaLinea()],
  });

  // Estados para ejemplares físicos
  const [ejemplares, setEjemplares] = useState([]);
  const [paginaEjemplares, setPaginaEjemplares] = useState(0);
  const [totalPaginasEjemplares, setTotalPaginasEjemplares] = useState(0);
  const [cambiandoEjemplar, setCambiandoEjemplar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busquedaEjemplares, setBusquedaEjemplares] = useState("");

  // Cargar libros, proveedores, ubicaciones, recepciones y ejemplares.
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");

    const resultados = await Promise.allSettled([
      listarLibrosGestion(),
      listarProveedores(),
      listarUbicaciones(),
      listarRecepciones(),
      listarEjemplares({
        page: paginaEjemplares,
        size: 50,
        estado: filtroEstado || undefined,
        q: busquedaEjemplares || undefined,
      }),
    ]);

    const [
      librosResult,
      proveedoresResult,
      ubicacionesResult,
      recepcionesResult,
      ejemplaresResult,
    ] = resultados;

    const errores = [];

    if (librosResult.status === "fulfilled") {
      const lista = extraerElementos(librosResult.value)
          .map(adaptarLibro)
          .filter((libro) => libro.id > 0);

      setLibros(lista);
    } else {
      setLibros([]);
      errores.push("No se pudieron cargar los libros.");
    }

    if (proveedoresResult.status === "fulfilled") {
      const lista = extraerElementos(proveedoresResult.value)
          .map(adaptarProveedor)
          .filter(
              (item) =>
                  Number.isInteger(item.id) &&
                  item.id > 0 &&
                  item.razonSocial
          );

      setProveedores(lista);
    } else {
      setProveedores([]);
      errores.push("No se pudieron cargar los proveedores.");
    }

    if (ubicacionesResult.status === "fulfilled") {
      const lista = extraerElementos(ubicacionesResult.value)
          .map(adaptarUbicacion)
          .filter(
              (item) =>
                  Number.isInteger(item.id) &&
                  item.id > 0 &&
                  item.codigo &&
                  item.descripcion
          );

      setUbicaciones(lista);
    } else {
      setUbicaciones([]);
      errores.push("No se pudieron cargar las ubicaciones.");
    }

    if (recepcionesResult.status === "fulfilled") {
      setRecepciones(
          extraerElementos(recepcionesResult.value)
      );
    } else {
      setRecepciones([]);
      errores.push("No se pudo cargar el historial de recepciones.");
    }

    if (ejemplaresResult.status === "fulfilled") {
      const respuesta = ejemplaresResult.value;

      setEjemplares(extraerElementos(respuesta));

      setTotalPaginasEjemplares(
          Number(
              respuesta?.totalPaginas ??
              respuesta?.totalPages ??
              0
          )
      );
    } else {
      setEjemplares([]);
      setTotalPaginasEjemplares(0);

      errores.push("No se pudieron cargar los ejemplares físicos.");
    }

    if (errores.length > 0) {
      setError(errores.join(" "));
    }

    setCargando(false);
  }, [paginaEjemplares, filtroEstado, busquedaEjemplares]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const proveedoresActivos = useMemo(
      () => proveedores.filter((proveedor) => proveedor.activo),
      [proveedores]
  );

  const ubicacionesActivas = useMemo(
      () => ubicaciones.filter((ubicacion) => ubicacion.activa),
      [ubicaciones]
  );

  // Libros que coinciden con la búsqueda.
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    return libros.filter((libro) => {
      const contenido = [
        libro.title,
        libro.author,
        libro.isbn,
      ]
          .join(" ")
          .toLocaleLowerCase("es");

      return contenido.includes(texto);
    });
  }, [libros, busqueda]);

  // Resumen real del inventario.
  const estadisticas = useMemo(() => {
    const unidadesVenta = libros.reduce(
        (suma, libro) => suma + libro.stockVenta,
        0
    );

    const unidadesPrestamo = libros.reduce(
        (suma, libro) => suma + libro.stockPrestamo,
        0
    );

    const stockBajo = libros.filter((libro) => {
      const ventaBaja =
          libro.ventaHabilitada &&
          libro.stockVenta <= 3;

      const prestamoBajo =
          libro.prestamoHabilitado &&
          libro.stockPrestamo <= 3;

      return ventaBaja || prestamoBajo;
    }).length;

    return {
      totalLibros: libros.length,
      unidadesVenta,
      unidadesPrestamo,
      stockBajo,
    };
  }, [libros]);

  // Abrir el formulario.
  const abrirRecepcion = () => {
    setFormRecepcion({
      tipoOrigen: "Compra",
      proveedorId: "",
      donante: "",
      documentoReferencia: "",
      observaciones: "",
      lineas: [nuevaLinea()],
    });

    setError("");
    setMensaje("");
    setModalAbierto(true);
  };

  // Actualizar datos generales.
  const actualizarCampo = (campo, valor) => {
    setFormRecepcion((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setError("");
  };

  // Actualizar una línea de recepción.
  const actualizarLinea = (index, campo, valor) => {
    setFormRecepcion((anterior) => ({
      ...anterior,
      lineas: anterior.lineas.map((linea, i) =>
          i === index
              ? {
                ...linea,
                [campo]: valor,
              }
              : linea
      ),
    }));

    setError("");
  };

  // Añadir una nueva línea.
  const agregarLinea = () => {
    setFormRecepcion((anterior) => ({
      ...anterior,
      lineas: [
        ...anterior.lineas,
        nuevaLinea(),
      ],
    }));
  };

  // Eliminar una línea.
  const eliminarLinea = (index) => {
    setFormRecepcion((anterior) => ({
      ...anterior,
      lineas: anterior.lineas.filter(
          (_, i) => i !== index
      ),
    }));
  };

  // Validar y registrar recepción.
  const guardarRecepcion = async (event) => {
    event.preventDefault();

    if (guardando) return;

    setError("");
    setMensaje("");

    if (!Number.isInteger(Number(formRecepcion.proveedorId)) ||
        Number(formRecepcion.proveedorId) <= 0) {
      setError("Selecciona un proveedor válido.");
      return;
    }

    if (
        formRecepcion.documentoReferencia.trim().length > 100
    ) {
      setError(
          "El documento de referencia no puede superar los 100 caracteres."
      );
      return;
    }

    if (
        formRecepcion.observaciones.trim().length > 500
    ) {
      setError(
          "Las observaciones no pueden superar los 500 caracteres."
      );
      return;
    }

    if (
        !Array.isArray(formRecepcion.lineas) ||
        formRecepcion.lineas.length === 0
    ) {
      setError("Agrega al menos un libro a la recepción.");
      return;
    }

    for (let index = 0; index < formRecepcion.lineas.length; index++) {
      const linea = formRecepcion.lineas[index];

      const cantidad = Number(linea.cantidad);
      const costo = Number(linea.costoUnitario);

      const libroExiste = libros.some(
          (libro) =>
              libro.id === Number(linea.libroId)
      );

      const ubicacionExiste = ubicaciones.some(
          (ubicacion) =>
              ubicacion.id === Number(linea.ubicacionId)
      );

      if (!libroExiste) {
        setError(
            `Selecciona un libro válido en la línea ${index + 1}.`
        );
        return;
      }

      if (
          !Number.isInteger(cantidad) ||
          cantidad <= 0 ||
          cantidad > 10000
      ) {
        setError(
            `La cantidad de la línea ${index + 1} debe ser un número entero entre 1 y 10000.`
        );
        return;
      }

      if (
          !Number.isFinite(costo) ||
          costo < 0
      ) {
        setError(
            `El costo unitario de la línea ${index + 1} no es válido.`
        );
        return;
      }

      if (!ubicacionExiste) {
        setError(
            `Selecciona una ubicación válida en la línea ${index + 1}.`
        );
        return;
      }

      if (!linea.esVendible && !linea.esPrestamo) {
        setError(
            `Elige si los ejemplares de la línea ${index + 1} serán para venta o préstamo.`
        );
        return;
      }

      if (
          linea.observaciones.trim().length > 250
      ) {
        setError(
            `Las observaciones de la línea ${index + 1} son demasiado largas.`
        );
        return;
      }
    }

    try {
      setGuardando(true);

      const resultado = await registrarRecepcion(
          formRecepcion
      );

      const codigo =
          resultado?.codigoRecepcion ||
          resultado?.recepcionId ||
          "";

      setMensaje(
          codigo
              ? `Recepción ${codigo} registrada correctamente.`
              : "Recepción registrada correctamente."
      );

      setModalAbierto(false);

      await cargarDatos();
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo registrar la recepción."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Registrar un daño en un ejemplar física.
  const registrarDano = async (ejemplar) => {
    if (ejemplar.estado !== "Disponible") {
      setError(
          "Solo se pueden registrar daños en ejemplares que estén disponibles."
      );
      return;
    }

    const motivo = window.prompt(
        `Describe el daño del ejemplar ${ejemplar.codigoEjemplar}:`
    );

    if (motivo === null) {
      return;
    }

    const motivoValidado = motivo.trim();

    if (
        motivoValidado.length < 5 ||
        motivoValidado.length > 300
    ) {
      setError(
          "El motivo debe tener entre 5 y 300 caracteres."
      );
      return;
    }

    if (
        !window.confirm(
            `¿Confirmas el registro del daño en ${ejemplar.codigoEjemplar}?`
        )
    ) {
      return;
    }

    try {
      setCambiandoEjemplar(ejemplar.ejemplarId);
      setError("");
      setMensaje("");

      const resultado = await cambiarEstadoEjemplar(
          ejemplar.ejemplarId,
          {
            accion: "REGISTRAR_DANIO",
            motivo: motivoValidado,
          }
      );

      setMensaje(
          `Se actualizó el ejemplar ${resultado.codigoEjemplar || ejemplar.codigoEjemplar} correctamente.`
      );

      await cargarDatos();
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo registrar el daño."
      );
    } finally {
      setCambiandoEjemplar(null);
    }
  };

  // Abrir formularios de proveedores y ubicaciones.
  const abrirNuevoProveedor = () => {
    setIdMaestroEditando(null);
    setFormProveedor({
      razonSocial: "",
      documentoFiscal: "",
      contacto: "",
      correo: "",
      telefono: "",
      direccion: "",
      activo: true,
    });
    setError("");
    setMensaje("");
    setModalMaestro("proveedor");
  };

  const editarProveedor = (proveedor) => {
    setIdMaestroEditando(proveedor.id);
    setFormProveedor({
      razonSocial: proveedor.razonSocial,
      documentoFiscal: proveedor.documentoFiscal,
      contacto: proveedor.contacto,
      correo: proveedor.correo,
      telefono: proveedor.telefono,
      direccion: proveedor.direccion,
      activo: proveedor.activo,
    });
    setError("");
    setMensaje("");
    setModalMaestro("proveedor");
  };

  const abrirNuevaUbicacion = () => {
    setIdMaestroEditando(null);
    setFormUbicacion({ codigo: "", descripcion: "", activa: true });
    setError("");
    setMensaje("");
    setModalMaestro("ubicacion");
  };

  const editarUbicacion = (ubicacion) => {
    setIdMaestroEditando(ubicacion.id);
    setFormUbicacion({
      codigo: ubicacion.codigo,
      descripcion: ubicacion.descripcion,
      activa: ubicacion.activa,
    });
    setError("");
    setMensaje("");
    setModalMaestro("ubicacion");
  };

  const actualizarCampoProveedor = (campo, valor) => {
    setFormProveedor((actual) => ({ ...actual, [campo]: valor }));
    setError("");
  };

  const actualizarCampoUbicacion = (campo, valor) => {
    setFormUbicacion((actual) => ({ ...actual, [campo]: valor }));
    setError("");
  };

  // Guardar proveedor o ubicación usando POST/PUT según corresponda.
  const guardarMaestro = async (event) => {
    event.preventDefault();
    if (guardando) return;

    setError("");
    setMensaje("");

    try {
      setGuardando(true);

      if (modalMaestro === "proveedor") {
        if (idMaestroEditando) {
          await actualizarProveedor(idMaestroEditando, formProveedor);
          setMensaje("Proveedor actualizado correctamente.");
        } else {
          await crearProveedor(formProveedor);
          setMensaje("Proveedor registrado correctamente.");
        }
      } else if (modalMaestro === "ubicacion") {
        if (idMaestroEditando) {
          await actualizarUbicacion(idMaestroEditando, formUbicacion);
          setMensaje("Ubicación actualizada correctamente.");
        } else {
          await crearUbicacion(formUbicacion);
          setMensaje("Ubicación registrada correctamente.");
        }
      }

      setModalMaestro(null);
      setIdMaestroEditando(null);
      await cargarDatos();
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          err.message ||
          "No se pudo guardar el registro."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Sumar ejemplares de una recepción.
  const contarEjemplares = (recepcion) => {
    const lineas = Array.isArray(recepcion.lineas)
        ? recepcion.lineas
        : [];

    return lineas.reduce(
        (total, linea) =>
            total + Number(linea.cantidad ?? 0),
        0
    );
  };

  const totalEstimado = formRecepcion.lineas.reduce(
      (total, linea) =>
          total +
          Number(linea.cantidad || 0) *
          Number(linea.costoUnitario || 0),
      0
  );

  return (
      <main className="mx-auto max-w-7xl p-6 md:p-10">

        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#3D7669]">
              Administración
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Inventario
            </h1>

            <p className="mt-2 text-slate-500">
              Controla las existencias y registra las entradas
              de ejemplares.
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
                onClick={abrirRecepcion}
                disabled={
                    cargando ||
                    libros.length === 0 ||
                    proveedoresActivos.length === 0 ||
                    ubicacionesActivas.length === 0
                }
                className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-5 py-3 font-semibold text-white hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={19} />
              Registrar recepción
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
          {[
            {
              titulo: "Libros registrados",
              valor: estadisticas.totalLibros,
              Icono: BookOpen,
            },
            {
              titulo: "Ejemplares para venta",
              valor: estadisticas.unidadesVenta,
              Icono: Package,
            },
            {
              titulo: "Ejemplares para préstamo",
              valor: estadisticas.unidadesPrestamo,
              Icono: Warehouse,
            },
            {
              titulo: "Libros con stock bajo",
              valor: estadisticas.stockBajo,
              Icono: AlertTriangle,
            },
          ].map(({ titulo, valor, Icono }) => (
              <div
                  key={titulo}
                  className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {titulo}
                  </p>

                  <Icono
                      size={20}
                      className="text-[#3D7669]"
                  />
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-800">
                  {valor}
                </p>
              </div>
          ))}
        </div>

        {/* MANTENIMIENTO DE PROVEEDORES Y UBICACIONES */}
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-[#3D7669]" />
                <h2 className="text-lg font-bold text-slate-800">Proveedores</h2>
              </div>
              <button
                  type="button"
                  onClick={abrirNuevoProveedor}
                  className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#315e55]"
              >
                <Plus size={16} /> Nuevo proveedor
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-slate-500">
                <tr>
                  <th className="pb-3">Razón social</th>
                  <th className="pb-3">Documento fiscal</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
                </thead>
                <tbody>
                {proveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="border-b border-stone-100">
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{proveedor.razonSocial}</p>
                        <p className="text-xs text-slate-500">{proveedor.correo}</p>
                      </td>
                      <td className="py-3">{proveedor.documentoFiscal}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${proveedor.activo ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                          {proveedor.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => editarProveedor(proveedor)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#3D7669] hover:bg-[#F0F7F4]">
                          <Pencil size={15} /> Editar
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
              {!cargando && proveedores.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">No hay proveedores registrados.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-[#3D7669]" />
                <h2 className="text-lg font-bold text-slate-800">Ubicaciones físicas</h2>
              </div>
              <button
                  type="button"
                  onClick={abrirNuevaUbicacion}
                  className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#315e55]"
              >
                <Plus size={16} /> Nueva ubicación
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-slate-500">
                <tr>
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Descripción</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
                </thead>
                <tbody>
                {ubicaciones.map((ubicacion) => (
                    <tr key={ubicacion.id} className="border-b border-stone-100">
                      <td className="py-3 font-semibold text-slate-800">{ubicacion.codigo}</td>
                      <td className="py-3">{ubicacion.descripcion}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ubicacion.activa ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                          {ubicacion.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => editarUbicacion(ubicacion)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#3D7669] hover:bg-[#F0F7F4]">
                          <Pencil size={15} /> Editar
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
              {!cargando && ubicaciones.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">No hay ubicaciones registradas.</p>
              )}
            </div>
          </section>
        </div>

        {/* LIBROS Y EXISTENCIAS */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Package
                size={20}
                className="text-[#3D7669]"
            />

            <h2 className="text-lg font-bold text-slate-800">
              Existencias por libro
            </h2>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <Search
                size={19}
                className="text-slate-400"
            />

            <input
                type="search"
                maxLength={100}
                value={busqueda}
                onChange={(e) =>
                    setBusqueda(e.target.value.slice(0, 100))
                }
                placeholder="Buscar libro por título, autor o ISBN..."
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
                <th className="pb-4">Total inventario</th>
                <th className="pb-4">Disponibilidad</th>
              </tr>
              </thead>

              <tbody>
              {filtrados.map((libro) => {
                const total =
                    libro.stockVenta +
                    libro.stockPrestamo;

                const sinStock = total === 0;

                const stockBajo =
                    !sinStock && total <= 3;

                return (
                    <tr
                        key={libro.id}
                        className="border-b border-stone-100"
                    >
                      <td className="py-4">
                        <p className="font-semibold text-slate-800">
                          {libro.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {libro.author}
                        </p>

                        <p className="text-xs text-slate-400">
                          ISBN: {libro.isbn}
                        </p>
                      </td>

                      <td className="py-4">
                        {libro.stockVenta}
                      </td>

                      <td className="py-4">
                        {libro.stockPrestamo}
                      </td>

                      <td className="py-4 font-medium">
                        {libro.enInventario}
                      </td>

                      <td className="py-4">
                        {sinStock ? (
                            <span className="font-semibold text-red-600">
                          Sin existencias
                        </span>
                        ) : stockBajo ? (
                            <span className="font-semibold text-amber-600">
                          Stock bajo
                        </span>
                        ) : (
                            <span className="font-semibold text-emerald-700">
                          Disponible
                        </span>
                        )}
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>

            {cargando && (
                <p className="py-10 text-center text-slate-500">
                  Cargando inventario desde el servidor...
                </p>
            )}

            {!cargando &&
                filtrados.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      No se encontraron libros.
                    </p>
                )}
          </div>
        </div>

        {/* HISTORIAL DE RECEPCIONES */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList
                size={20}
                className="text-[#3D7669]"
            />

            <h2 className="text-lg font-bold text-slate-800">
              Historial de recepciones
            </h2>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-slate-500">
              <tr>
                <th className="pb-4">Código</th>
                <th className="pb-4">Origen</th>
                <th className="pb-4">Proveedor</th>
                <th className="pb-4">Fecha</th>
                <th className="pb-4">Ejemplares</th>
              </tr>
              </thead>

              <tbody>
              {recepciones.map((recepcion, index) => (
                  <tr
                      key={
                          recepcion.recepcionId ??
                          recepcion.id ??
                          index
                      }
                      className="border-b border-stone-100"
                  >
                    <td className="py-4 font-semibold text-slate-800">
                      {recepcion.codigoRecepcion ||
                          `#${recepcion.recepcionId}`}
                    </td>

                    <td className="py-4">
                      {recepcion.tipoOrigen || "No especificado"}
                    </td>

                    <td className="py-4">
                      {recepcion.proveedor?.nombre ||
                          recepcion.donante ||
                          "No especificado"}
                    </td>

                    <td className="py-4">
                      {formatearFecha(
                          recepcion.fechaRecepcion
                      )}
                    </td>

                    <td className="py-4">
                      {contarEjemplares(recepcion)}
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>

            {!cargando && recepciones.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  Todavía no se han registrado recepciones.
                </p>
            )}
          </div>
        </div>

        {/* EJEMPLARES FÍSICOS */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Package size={20} className="text-[#3D7669]" />
                Gestión de ejemplares
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta los ejemplares físicos registrados en el inventario.
              </p>
            </div>

            <span className="text-sm text-slate-500">
            Página {paginaEjemplares + 1} de {Math.max(1, totalPaginasEjemplares)}
          </span>
          </div>

          {/* FILTROS */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
              <Search size={18} className="text-slate-400" />

              <input
                  type="search"
                  maxLength={100}
                  value={busquedaEjemplares}
                  onChange={(e) => {
                    setBusquedaEjemplares(
                        e.target.value.slice(0, 100)
                    );
                    setPaginaEjemplares(0);
                  }}
                  placeholder="Buscar por código o libro..."
                  className="w-full text-sm outline-none"
              />
            </div>

            <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaEjemplares(0);
                }}
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
            >
              <option value="">Todos los estados</option>
              <option value="Disponible">Disponible</option>
            </select>
          </div>

          {/* TABLA DE EJEMPLARES */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-slate-500">
              <tr>
                <th className="pb-4">Código</th>
                <th className="pb-4">Libro</th>
                <th className="pb-4">Ubicación</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4">Destino</th>
                <th className="pb-4">Condición</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
              </thead>

              <tbody>
              {ejemplares.map((ejemplar) => (
                  <tr
                      key={ejemplar.ejemplarId}
                      className="border-b border-stone-100"
                  >
                    <td className="py-4 font-semibold text-[#3D7669]">
                      {ejemplar.codigoEjemplar}
                    </td>

                    <td className="py-4">
                      <p className="font-medium text-slate-800">
                        {ejemplar.libro?.nombre || "Sin libro"}
                      </p>
                    </td>

                    <td className="py-4">
                      {ejemplar.ubicacion?.nombre || "Sin ubicación"}
                    </td>

                    <td className="py-4">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            ejemplar.estado === "Disponible"
                                ? "bg-emerald-50 text-emerald-700"
                                : ejemplar.estado === "Dañado"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                        }`}
                    >
                      {ejemplar.estado}
                    </span>
                    </td>

                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {ejemplar.esVendible && (
                            <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          Venta
                        </span>
                        )}

                        {ejemplar.esPrestamo && (
                            <span className="rounded bg-purple-50 px-2 py-1 text-xs text-purple-700">
                          Préstamo
                        </span>
                        )}

                        {!ejemplar.esVendible &&
                            !ejemplar.esPrestamo && (
                                <span className="text-xs text-slate-400">
                            Sin asignar
                          </span>
                            )}
                      </div>
                    </td>

                    <td className="py-4">
                      {ejemplar.condicionFisica || "No especificada"}
                    </td>

                    <td className="py-4 text-right">
                      {ejemplar.estado === "Disponible" ? (
                          <button
                              type="button"
                              onClick={() => registrarDano(ejemplar)}
                              disabled={
                                  cambiandoEjemplar === ejemplar.ejemplarId
                              }
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            {cambiandoEjemplar === ejemplar.ejemplarId
                                ? "Procesando..."
                                : "Registrar daño"}
                          </button>
                      ) : (
                          <span className="text-xs text-slate-400">
                        Sin acciones disponibles
                      </span>
                      )}
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>

            {!cargando && ejemplares.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  No se encontraron ejemplares.
                </p>
            )}

            {cargando && (
                <p className="py-8 text-center text-slate-500">
                  Cargando ejemplares...
                </p>
            )}
          </div>

          {/* PAGINACIÓN */}
          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">
            <button
                type="button"
                disabled={paginaEjemplares <= 0 || cargando}
                onClick={() =>
                    setPaginaEjemplares((pagina) => Math.max(0, pagina - 1))
                }
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="text-sm text-slate-500">
            {paginaEjemplares + 1} / {Math.max(1, totalPaginasEjemplares)}
          </span>

            <button
                type="button"
                disabled={
                    cargando ||
                    paginaEjemplares + 1 >= totalPaginasEjemplares
                }
                onClick={() =>
                    setPaginaEjemplares((pagina) => pagina + 1)
                }
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* MODAL DE PROVEEDOR / UBICACIÓN */}
        {modalMaestro && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
              <div role="dialog" aria-modal="true" aria-label={modalMaestro === "proveedor" ? "Formulario de proveedor" : "Formulario de ubicación"} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {idMaestroEditando ? "Editar" : "Registrar"} {modalMaestro === "proveedor" ? "proveedor" : "ubicación"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Los cambios se guardarán en la base de datos.</p>
                  </div>
                  <button type="button" disabled={guardando} onClick={() => setModalMaestro(null)} aria-label="Cerrar formulario" className="rounded-lg p-2 hover:bg-stone-100 disabled:opacity-40">
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={guardarMaestro} className="mt-6 space-y-5">
                  {modalMaestro === "proveedor" ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block sm:col-span-2">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Razón social *</span>
                            <input required minLength={2} maxLength={150} value={formProveedor.razonSocial} onChange={(e) => actualizarCampoProveedor("razonSocial", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Documento fiscal *</span>
                            <input required minLength={5} maxLength={30} value={formProveedor.documentoFiscal} onChange={(e) => actualizarCampoProveedor("documentoFiscal", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Persona de contacto *</span>
                            <input required minLength={2} maxLength={100} value={formProveedor.contacto} onChange={(e) => actualizarCampoProveedor("contacto", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico *</span>
                            <input required type="email" maxLength={150} value={formProveedor.correo} onChange={(e) => actualizarCampoProveedor("correo", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Teléfono *</span>
                            <input required type="tel" maxLength={20} value={formProveedor.telefono} onChange={(e) => actualizarCampoProveedor("telefono", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Dirección *</span>
                            <input required minLength={4} maxLength={200} value={formProveedor.direccion} onChange={(e) => actualizarCampoProveedor("direccion", e.target.value)} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                        </div>
                        <label className="flex items-center gap-3 rounded-xl bg-[#F8F6F1] p-4 text-sm text-slate-700">
                          <input type="checkbox" checked={formProveedor.activo} onChange={(e) => actualizarCampoProveedor("activo", e.target.checked)} className="h-4 w-4 accent-[#3D7669]" />
                          Proveedor activo (disponible para nuevas recepciones)
                        </label>
                      </>
                  ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Código *</span>
                            <input required minLength={2} maxLength={30} value={formUbicacion.codigo} onChange={(e) => actualizarCampoUbicacion("codigo", e.target.value)} placeholder="Ej. EST-A1" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Descripción *</span>
                            <input required minLength={2} maxLength={150} value={formUbicacion.descripcion} onChange={(e) => actualizarCampoUbicacion("descripcion", e.target.value)} placeholder="Ej. Estante A, nivel 1" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]" />
                          </label>
                        </div>
                        <label className="flex items-center gap-3 rounded-xl bg-[#F8F6F1] p-4 text-sm text-slate-700">
                          <input type="checkbox" checked={formUbicacion.activa} onChange={(e) => actualizarCampoUbicacion("activa", e.target.checked)} className="h-4 w-4 accent-[#3D7669]" />
                          Ubicación activa (disponible para nuevas recepciones)
                        </label>
                      </>
                  )}

                  {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                  <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                    <button type="button" disabled={guardando} onClick={() => setModalMaestro(null)} className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600 disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={guardando} className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                      {guardando ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
                      {guardando ? "Guardando..." : idMaestroEditando ? "Guardar cambios" : "Registrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* MODAL DE RECEPCIÓN */}
        {modalAbierto && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Registrar recepción de inventario"
                  className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Registrar recepción
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Registra la entrada de ejemplares al inventario.
                    </p>
                  </div>

                  <button
                      type="button"
                      disabled={guardando}
                      onClick={() => setModalAbierto(false)}
                      aria-label="Cerrar formulario"
                      className="rounded-lg p-2 hover:bg-stone-100 disabled:opacity-40"
                  >
                    <X size={22} />
                  </button>
                </div>

                <form
                    onSubmit={guardarRecepcion}
                    className="mt-6 space-y-6"
                >
                  {/* DATOS GENERALES */}
                  <section className="rounded-xl bg-[#F8F6F1] p-5">
                    <h3 className="font-semibold text-slate-800">
                      Datos generales
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Tipo de origen
                    </span>

                        <select
                            value={formRecepcion.tipoOrigen}
                            disabled
                            className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm"
                        >
                          <option value="Compra">
                            Compra
                          </option>
                        </select>
                      </label>

                      <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Proveedor *
                    </span>

                        <select
                            value={formRecepcion.proveedorId}
                            onChange={(e) =>
                                actualizarCampo(
                                    "proveedorId",
                                    e.target.value
                                )
                            }
                            required
                            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                        >
                          <option value="">
                            Selecciona un proveedor
                          </option>

                          {proveedoresActivos.map((proveedor) => (
                              <option
                                  key={proveedor.id}
                                  value={proveedor.id}
                              >
                                {proveedor.nombre}
                              </option>
                          ))}
                        </select>

                        {proveedoresActivos.length === 0 && (
                            <span className="mt-1 block text-xs text-red-600">
                        No hay proveedores disponibles.
                      </span>
                        )}
                      </label>

                      <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Documento de referencia
                    </span>

                        <input
                            type="text"
                            maxLength={100}
                            value={
                              formRecepcion.documentoReferencia
                            }
                            onChange={(e) =>
                                actualizarCampo(
                                    "documentoReferencia",
                                    e.target.value
                                )
                            }
                            placeholder="Factura, boleta u otro documento"
                            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                        />
                      </label>

                      <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Observaciones generales
                    </span>

                        <input
                            type="text"
                            maxLength={500}
                            value={formRecepcion.observaciones}
                            onChange={(e) =>
                                actualizarCampo(
                                    "observaciones",
                                    e.target.value
                                )
                            }
                            placeholder="Observaciones..."
                            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                        />
                      </label>
                    </div>
                  </section>

                  {/* LÍNEAS */}
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          Libros recibidos
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Puedes incluir varios libros en una recepción.
                        </p>
                      </div>

                      <button
                          type="button"
                          onClick={agregarLinea}
                          className="flex items-center gap-2 rounded-lg border border-[#3D7669] px-3 py-2 text-sm font-semibold text-[#3D7669]"
                      >
                        <Plus size={16} />
                        Agregar libro
                      </button>
                    </div>

                    <div className="mt-5 space-y-4">
                      {formRecepcion.lineas.map((linea, index) => (
                          <div
                              key={index}
                              className="rounded-xl border border-stone-200 p-5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="font-semibold text-slate-800">
                                Libro {index + 1}
                              </h4>

                              {formRecepcion.lineas.length > 1 && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          eliminarLinea(index)
                                      }
                                      className="flex items-center gap-1 text-sm text-red-600"
                                  >
                                    <Trash2 size={16} />
                                    Quitar
                                  </button>
                              )}
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <label className="block sm:col-span-2">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Libro *
                          </span>

                                <select
                                    value={linea.libroId}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "libroId",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                                >
                                  <option value="">
                                    Selecciona un libro
                                  </option>

                                  {libros.map((libro) => (
                                      <option
                                          key={libro.id}
                                          value={libro.id}
                                      >
                                        {libro.title} — {libro.isbn}
                                      </option>
                                  ))}
                                </select>
                              </label>

                              <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Cantidad *
                          </span>

                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    step="1"
                                    value={linea.cantidad}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "cantidad",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                                />
                              </label>

                              <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Costo unitario (S/) *
                          </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={linea.costoUnitario}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "costoUnitario",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                                />
                              </label>

                              <label className="block sm:col-span-2">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Ubicación física *
                          </span>

                                <select
                                    value={linea.ubicacionId}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "ubicacionId",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]"
                                >
                                  <option value="">
                                    Selecciona una ubicación
                                  </option>

                                  {ubicacionesActivas.map((ubicacion) => (
                                      <option
                                          key={ubicacion.id}
                                          value={ubicacion.id}
                                      >
                                        {ubicacion.nombre}
                                      </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className="mt-5 rounded-lg bg-[#F8F6F1] p-4">
                              <p className="text-sm font-semibold text-slate-700">
                                Destino de los ejemplares
                              </p>

                              <div className="mt-3 flex flex-wrap gap-6">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                      type="checkbox"
                                      checked={linea.esVendible}
                                      onChange={(e) =>
                                          actualizarLinea(
                                              index,
                                              "esVendible",
                                              e.target.checked
                                          )
                                      }
                                      className="h-4 w-4 accent-[#3D7669]"
                                  />

                                  Para venta
                                </label>

                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                      type="checkbox"
                                      checked={linea.esPrestamo}
                                      onChange={(e) =>
                                          actualizarLinea(
                                              index,
                                              "esPrestamo",
                                              e.target.checked
                                          )
                                      }
                                      className="h-4 w-4 accent-[#3D7669]"
                                  />

                                  Para préstamo
                                </label>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Condición física
                          </span>

                                <select
                                    value={linea.condicionFisica}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "condicionFisica",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
                                >
                                  <option value="Nuevo">
                                    Nuevo
                                  </option>
                                </select>
                              </label>

                              <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Observaciones de la línea
                          </span>

                                <input
                                    type="text"
                                    maxLength={250}
                                    value={linea.observaciones}
                                    onChange={(e) =>
                                        actualizarLinea(
                                            index,
                                            "observaciones",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Opcional"
                                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
                                />
                              </label>
                            </div>
                          </div>
                      ))}
                    </div>
                  </section>

                  {/* RESUMEN */}
                  <section className="rounded-xl bg-[#F0F7F4] p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-600">
                          Total de ejemplares
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-800">
                          {formRecepcion.lineas.reduce(
                              (total, linea) =>
                                  total +
                                  (Number(linea.cantidad) || 0),
                              0
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          Costo estimado de recepción
                        </p>

                        <p className="mt-1 text-2xl font-bold text-[#3D7669]">
                          S/ {totalEstimado.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      El costo estimado es informativo. Los registros
                      definitivos serán procesados por el servidor.
                    </p>
                  </section>

                  {/* ERRORES */}
                  {error && (
                      <p
                          role="alert"
                          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                      >
                        {error}
                      </p>
                  )}

                  {/* ACCIONES */}
                  <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                    <button
                        type="button"
                        disabled={guardando}
                        onClick={() => setModalAbierto(false)}
                        className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={
                            guardando ||
                            proveedoresActivos.length === 0 ||
                            ubicacionesActivas.length === 0 ||
                            libros.length === 0
                        }
                        className="flex items-center gap-2 rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guardando ? (
                          <RefreshCw
                              size={17}
                              className="animate-spin"
                          />
                      ) : (
                          <Save size={17} />
                      )}

                      {guardando
                          ? "Registrando..."
                          : "Registrar recepción"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </main>
  );
}
