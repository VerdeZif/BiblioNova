import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Banknote,
  CreditCard,
  MapPin,
  ShoppingBag,
  Store,
  Truck,
  RefreshCw,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import {
  crearPedido,
  obtenerMisDirecciones,
  obtenerPedidoPorId,
  procesarPagoSimulado,
  registrarDireccion,
} from "../../services/pedidos";

// Obtener las direcciones desde distintas estructuras habituales
// de respuesta paginada o de colección.
function extraerDirecciones(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.contenido)) return data.contenido;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.direcciones)) return data.direcciones;

  return [];
}

// Extraer el identificador soportando objetos o valores primitivos (ID numérico/string)
function obtenerDireccionId(direccion) {
  if (direccion === null || direccion === undefined) return null;

  if (typeof direccion === "number" || typeof direccion === "string") {
    const num = Number(direccion);
    return !isNaN(num) && num > 0 ? num : null;
  }

  if (typeof direccion === "object") {
    const idEncontrado =
        direccion.direccionId ??
        direccion.id ??
        direccion.direccionClienteId ??
        direccion.idDireccion ??
        direccion.codigoDireccion ??
        direccion.codigo;

    if (idEncontrado !== undefined && idEncontrado !== null) {
      const num = Number(idEncontrado);
      return !isNaN(num) && num > 0 ? num : null;
    }
  }

  return null;
}

function obtenerTextoDireccion(direccion) {
  const direccionPrincipal =
      direccion.direccionCompleta ??
      direccion.direccion ??
      direccion.descripcion ??
      direccion.calle ??
      "";

  const distrito =
      direccion.distrito ??
      direccion.nombreDistrito ??
      "";

  const referencia =
      direccion.referencia ?? "";

  return [
    direccionPrincipal,
    distrito,
    referencia,
  ]
      .filter((valor) => typeof valor === "string" && valor.trim())
      .join(" · ");
}

// Obtener identificador del pedido creado.
function obtenerIdPedido(data) {
  const pedido = data?.pedido ?? data?.data ?? data;

  return (
      pedido?.pedidoId ??
      pedido?.id ??
      data?.pedidoId ??
      null
  );
}

// Obtener el identificador del pago generado.
function obtenerIdPago(data) {
  const pedido = data?.pedido ?? data?.data ?? data;

  const pagos = Array.isArray(pedido?.pagos)
      ? pedido.pagos
      : [];

  const pago = pagos.find((item) => {
    const id =
        item?.pagoPedidoId ??
        item?.pagoId ??
        item?.id;

    return Number.isInteger(Number(id)) && Number(id) > 0;
  });

  return pago
      ? Number(
          pago.pagoPedidoId ??
          pago.pagoId ??
          pago.id
      )
      : null;
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    usuario,
    cargando: cargandoAuth,
  } = useAuth();

  const {
    items,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Direcciones guardadas del cliente.
  const [direcciones, setDirecciones] = useState([]);
  const [direccionId, setDireccionId] = useState("");

  const [cargandoDirecciones, setCargandoDirecciones] =
      useState(true);

  const [errorDirecciones, setErrorDirecciones] =
      useState("");

  // Estados para registro de dirección desde el checkout.
  const [mostrarFormularioDireccion, setMostrarFormularioDireccion] =
      useState(false);

  const [guardandoDireccion, setGuardandoDireccion] =
      useState(false);

  const [errorRegistroDireccion, setErrorRegistroDireccion] =
      useState("");

  const [exitoRegistroDireccion, setExitoRegistroDireccion] =
      useState("");

  const [formDireccion, setFormDireccion] = useState({
    destinatario: "",
    telefono: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    referencia: "",
    predeterminada: false,
  });

  // Modalidad de entrega.
  const [deliveryType, setDeliveryType] =
      useState("recojo");

  // Código de pago que espera Spring Boot.
  const [paymentMethod, setPaymentMethod] =
      useState("EFECTIVO_TIENDA");

  // Observaciones opcionales.
  const [observaciones, setObservaciones] =
      useState("");

  const [procesando, setProcesando] = useState(false);

  const inputClass =
      "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3D7669]";

  // Validar que la sesión sea de un cliente.
  useEffect(() => {
    if (cargandoAuth) return;

    if (!usuario) {
      navigate("/login", {
        replace: true,
        state: { from: "/checkout" },
      });

      return;
    }

    if (usuario.rol !== "Cliente") {
      navigate("/catalogo", { replace: true });
    }
  }, [usuario, cargandoAuth, navigate]);

  // Consultar las direcciones guardadas.
  useEffect(() => {
    if (cargandoAuth || usuario?.rol !== "Cliente") {
      return;
    }

    let activo = true;

    async function cargarDirecciones() {
      try {
        setCargandoDirecciones(true);
        setErrorDirecciones("");

        const resultado = await obtenerMisDirecciones();

        const lista = extraerDirecciones(resultado);

        const direccionesValidas = lista.filter((direccion) => {
          const id = obtenerDireccionId(direccion);

          return (
              Number.isInteger(Number(id)) &&
              Number(id) > 0
          );
        });

        if (activo) {
          setDirecciones(direccionesValidas);

          // Seleccionar automáticamente la primera dirección.
          if (direccionesValidas.length > 0) {
            setDireccionId(
                String(obtenerDireccionId(direccionesValidas[0]))
            );
          } else {
            setDireccionId("");
          }
        }
      } catch (err) {
        if (activo) {
          setDirecciones([]);
          setDireccionId("");

          setErrorDirecciones(
              err.response?.data?.mensaje ||
              "No se pudieron cargar tus direcciones."
          );
        }
      } finally {
        if (activo) {
          setCargandoDirecciones(false);
        }
      }
    }

    cargarDirecciones();

    return () => {
      activo = false;
    };
  }, [usuario, cargandoAuth]);

  // Cambiar modalidad y seleccionar un método de pago válido.
  const changeDeliveryType = (type) => {
    setError("");
    setMensaje("");

    if (!["recojo", "delivery"].includes(type)) {
      return;
    }

    if (type === "delivery" && direcciones.length === 0) {
      setError(
          "Necesitas tener una dirección registrada para solicitar delivery."
      );
    }

    setDeliveryType(type);

    if (type === "delivery") {
      setPaymentMethod("CONTRAENTREGA");
    } else {
      setPaymentMethod("EFECTIVO_TIENDA");
    }
  };

  const actualizarCampoDireccion = (campo, valor) => {
    setFormDireccion((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErrorRegistroDireccion("");
  };

  const guardarDireccion = async () => {
    if (guardandoDireccion) return;

    setErrorRegistroDireccion("");
    setExitoRegistroDireccion("");

    try {
      setGuardandoDireccion(true);

      const resultado = await registrarDireccion(formDireccion);

      const nuevaDireccion =
          resultado?.direccion ??
          resultado?.data?.direccion ??
          resultado?.data ??
          resultado;

      let nuevoId =
          obtenerDireccionId(nuevaDireccion) ??
          obtenerDireccionId(resultado);

      // Fallback: si el backend no devolvió el ID en la respuesta, se recarga la lista de direcciones
      if (!nuevoId || Number(nuevoId) <= 0) {
        const respuestaRecargada = await obtenerMisDirecciones();
        const listaActualizada = extraerDirecciones(respuestaRecargada);

        if (listaActualizada.length > 0) {
          setDirecciones(listaActualizada);
          const primerId = obtenerDireccionId(listaActualizada[0]);

          if (primerId) {
            setDireccionId(String(primerId));
            setFormDireccion({
              destinatario: "",
              telefono: "",
              departamento: "",
              provincia: "",
              distrito: "",
              direccion: "",
              referencia: "",
              predeterminada: false,
            });
            setMostrarFormularioDireccion(false);
            setDeliveryType("delivery");
            setExitoRegistroDireccion(
                "Tu dirección se registró correctamente y fue seleccionada para este pedido."
            );
            return;
          }
        }

        throw new Error(
            "La dirección se registró, pero el servidor no devolvió su identificador."
        );
      }

      const direccionCompleta = {
        ...formDireccion,
        ...(typeof nuevaDireccion === "object" ? nuevaDireccion : {}),
        direccionId: Number(nuevoId),
      };

      setDirecciones((anteriores) => {
        const sinDuplicados = anteriores.filter(
            (item) => String(obtenerDireccionId(item)) !== String(nuevoId)
        );

        return [direccionCompleta, ...sinDuplicados];
      });

      setDireccionId(String(nuevoId));

      setFormDireccion({
        destinatario: "",
        telefono: "",
        departamento: "",
        provincia: "",
        distrito: "",
        direccion: "",
        referencia: "",
        predeterminada: false,
      });

      setMostrarFormularioDireccion(false);
      setDeliveryType("delivery");

      setExitoRegistroDireccion(
          "Tu dirección se registró correctamente y fue seleccionada para este pedido."
      );
    } catch (error) {
      setErrorRegistroDireccion(
          error.response?.data?.mensaje ||
          error.message ||
          "No se pudo registrar la dirección."
      );
    } finally {
      setGuardandoDireccion(false);
    }
  };

  // Opciones disponibles según modalidad.
  const opcionesPago =
      deliveryType === "recojo"
          ? [
            {
              codigo: "EFECTIVO_TIENDA",
              nombre: "Efectivo en tienda",
              descripcion: "Paga cuando recojas tu pedido.",
              icono: Store,
            },
            {
              codigo: "TARJETA_TIENDA",
              nombre: "Tarjeta en tienda",
              descripcion: "Paga con tarjeta al recoger.",
              icono: CreditCard,
            },
            {
              codigo: "PAGO_ONLINE",
              nombre: "Pago online simulado",
              descripcion: "Prueba de pago mediante el servidor.",
              icono: CreditCard,
            },
          ]
          : [
            {
              codigo: "CONTRAENTREGA",
              nombre: "Pago contraentrega",
              descripcion: "Paga al recibir tus libros.",
              icono: Banknote,
            },
            {
              codigo: "PAGO_ONLINE",
              nombre: "Pago online simulado",
              descripcion: "Prueba de pago mediante el servidor.",
              icono: CreditCard,
            },
          ];

  // Validar el carrito antes de enviar el pedido.
  const validarCarrito = () => {
    if (items.length === 0) {
      return "Tu carrito está vacío.";
    }

    for (const item of items) {
      const libroId = Number(item.id);
      const cantidad = Number(item.quantity);
      const stock = Number(item.stockVenta);

      if (
          !Number.isInteger(libroId) ||
          libroId <= 0
      ) {
        return "Uno de los libros tiene un identificador inválido.";
      }

      if (
          !Number.isInteger(cantidad) ||
          cantidad <= 0
      ) {
        return "Hay una cantidad de productos inválida.";
      }

      if (
          !Number.isInteger(stock) ||
          stock <= 0 ||
          cantidad > stock
      ) {
        return `No hay stock suficiente para el libro ${item.title}.`;
      }
    }

    return "";
  };

  // Crear pedido real.
  const confirmarPedido = async () => {
    setError("");
    setMensaje("");

    if (procesando) return;

    if (!usuario || usuario.rol !== "Cliente") {
      setError("Debes iniciar sesión con una cuenta de cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    const errorCarrito = validarCarrito();

    if (errorCarrito) {
      setError(errorCarrito);
      return;
    }

    if (
        observaciones.trim().length > 500
    ) {
      setError(
          "Las observaciones no pueden superar los 500 caracteres."
      );
      return;
    }

    // Validar dirección de delivery.
    if (deliveryType === "delivery") {
      const direccionSeleccionada = direcciones.find(
          (direccion) =>
              String(obtenerDireccionId(direccion)) ===
              String(direccionId)
      );

      if (!direccionSeleccionada) {
        setError("Selecciona una dirección de entrega válida.");
        return;
      }
    }

    const metodosPermitidos =
        deliveryType === "recojo"
            ? [
              "EFECTIVO_TIENDA",
              "TARJETA_TIENDA",
              "PAGO_ONLINE",
            ]
            : [
              "CONTRAENTREGA",
              "PAGO_ONLINE",
            ];

    if (!metodosPermitidos.includes(paymentMethod)) {
      setError(
          "El método de pago no corresponde a la modalidad de entrega."
      );
      return;
    }

    // Preparar únicamente los datos que necesita el backend.
    const datosPedido = {
      tipoEntrega:
          deliveryType === "recojo"
              ? "Recojo"
              : "Delivery",

      metodoPagoCodigo: paymentMethod,

      lineas: items.map((item) => ({
        libroId: Number(item.id),
        cantidad: Number(item.quantity),
      })),

      observaciones: observaciones.trim(),
    };

    if (deliveryType === "delivery") {
      datosPedido.direccionId = Number(direccionId);
    }

    setProcesando(true);

    let pedidoCreado;

    // PRIMER PASO: registrar el pedido.
    try {
      pedidoCreado = await crearPedido(datosPedido);
    } catch (err) {
      setError(
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo registrar el pedido."
      );

      setProcesando(false);
      return;
    }

    // Desde aquí el pedido ya fue creado en el servidor.
    // Vaciamos el carrito para evitar enviar el mismo pedido otra vez.
    clearCart();

    let pedidoFinal = pedidoCreado;
    let avisoPago = "";

    // SEGUNDO PASO: procesar el pago online simulado.
    if (paymentMethod === "PAGO_ONLINE") {
      try {
        const pedidoId = obtenerIdPedido(pedidoCreado);

        if (!pedidoId) {
          throw new Error(
              "El servidor creó el pedido, pero no devolvió su identificador."
          );
        }

        let pedidoParaPago = pedidoCreado;

        let pagoId = obtenerIdPago(pedidoParaPago);

        // Si el pedido no contiene el pago, consultar su detalle.
        if (!pagoId) {
          pedidoParaPago =
              await obtenerPedidoPorId(pedidoId);

          pedidoFinal = pedidoParaPago;
          pagoId = obtenerIdPago(pedidoParaPago);
        }

        if (!pagoId) {
          throw new Error(
              "El pedido fue registrado, pero no se encontró el identificador del pago."
          );
        }

        const resultadoPago =
            await procesarPagoSimulado(
                pedidoId,
                pagoId,
                "APROBADO"
            );

        pedidoFinal = {
          ...pedidoParaPago,
          pagoSimulado: resultadoPago,
        };
      } catch (err) {
        // El pedido ya existe. No se debe volver a crear.
        avisoPago =
            err.response?.data?.mensaje ||
            err.message ||
            "El pedido se creó, pero no se pudo completar el pago simulado.";
      }
    }

    // TERCER PASO: mostrar la confirmación.
    setProcesando(false);

    const ultimoPedidoId = obtenerIdPedido(pedidoFinal);

    if (ultimoPedidoId) {
      sessionStorage.setItem(
          "biblionova_ultimo_pedido_id",
          String(ultimoPedidoId)
      );
    }

    navigate("/pedido-confirmado", {
      state: {
        pedido: pedidoFinal,
        avisoPago,
      },
    });
  };

  // Mientras se valida la sesión.
  if (
      cargandoAuth ||
      !usuario ||
      usuario.rol !== "Cliente"
  ) {
    return (
        <div className="min-h-screen bg-[#F8F6F1]">
          <Navbar />

          <div className="mx-auto max-w-5xl px-5 py-20 text-center text-slate-600">
            Verificando tu cuenta...
          </div>
        </div>
    );
  }

  const nombreCliente =
      usuario.nombreCompleto ||
      [usuario.nombres, usuario.apellidos]
          .filter(Boolean)
          .join(" ") ||
      usuario.nombreUsuario ||
      "Cliente";

  return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar />

        <main className="mx-auto max-w-6xl px-5 py-10">
          <Link
              to="/carrito"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3D7669]"
          >
            <ArrowLeft size={17} />
            Volver al carrito
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-slate-800 md:text-4xl">
            Finalizar compra
          </h1>

          <p className="mt-2 text-slate-500">
            Revisa tu pedido y selecciona cómo deseas recibirlo.
          </p>

          {items.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-white p-12 text-center">
                <ShoppingBag
                    size={45}
                    className="mx-auto text-stone-300"
                />

                <h2 className="mt-4 text-xl font-bold">
                  No tienes productos en tu carrito
                </h2>

                <Link
                    to="/catalogo"
                    className="mt-5 inline-block rounded-xl bg-[#3D7669] px-6 py-3 font-semibold text-white"
                >
                  Explorar catálogo
                </Link>
              </div>
          ) : (
              <div className="mt-8 grid items-start gap-7 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">

                  {/* DATOS DE LA CUENTA */}
                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800">
                      1. Datos del comprador
                    </h2>

                    <div className="mt-5">
                      <p className="font-semibold text-slate-800">
                        {nombreCliente}
                      </p>

                      {usuario.correo && (
                          <p className="mt-1 text-sm text-slate-500">
                            {usuario.correo}
                          </p>
                      )}

                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Utilizaremos los datos de tu cuenta.
                        No necesitas ingresarlos nuevamente.
                      </p>
                    </div>
                  </section>

                  {/* TIPO DE ENTREGA */}
                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800">
                      2. Método de entrega
                    </h2>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <button
                          type="button"
                          onClick={() =>
                              changeDeliveryType("recojo")
                          }
                          aria-pressed={deliveryType === "recojo"}
                          className={`rounded-xl border-2 p-5 text-left transition ${
                              deliveryType === "recojo"
                                  ? "border-[#3D7669] bg-[#F0F7F4]"
                                  : "border-stone-200"
                          }`}
                      >
                        <Store
                            className="text-[#3D7669]"
                            size={25}
                        />

                        <p className="mt-3 font-bold">
                          Recojo en tienda
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Recoge tu pedido en la tienda.
                        </p>
                      </button>

                      <button
                          type="button"
                          onClick={() =>
                              changeDeliveryType("delivery")
                          }
                          disabled={cargandoDirecciones}
                          aria-pressed={deliveryType === "delivery"}
                          className={`rounded-xl border-2 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              deliveryType === "delivery"
                                  ? "border-[#3D7669] bg-[#F0F7F4]"
                                  : "border-stone-200"
                          }`}
                      >
                        <Truck
                            className="text-[#3D7669]"
                            size={25}
                        />

                        <p className="mt-3 font-bold">
                          Delivery
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Recibe tus libros en una dirección registrada.
                        </p>
                      </button>
                    </div>

                    {deliveryType === "delivery" && (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MapPin size={17} />
                            Dirección de entrega
                          </div>

                          {cargandoDirecciones ? (
                              <p className="text-sm text-slate-500">
                                Cargando tus direcciones...
                              </p>
                          ) : (
                              <>
                                <label
                                    htmlFor="direccion-entrega"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                  Selecciona una dirección guardada
                                </label>

                                <select
                                    id="direccion-entrega"
                                    value={direccionId}
                                    onChange={(e) =>
                                        setDireccionId(e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                >
                                  <option value="">
                                    Selecciona una dirección
                                  </option>

                                  {direcciones.map((direccion) => {
                                    const id =
                                        obtenerDireccionId(direccion);

                                    return (
                                        <option
                                            key={id}
                                            value={String(id)}
                                        >
                                          {obtenerTextoDireccion(
                                                  direccion
                                              ) ||
                                              `Dirección ${id}`}
                                        </option>
                                    );
                                  })}
                                </select>
                              </>
                          )}

                          {errorDirecciones && (
                              <div
                                  role="alert"
                                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                              >
                                {errorDirecciones}

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.location.reload()
                                    }
                                    className="ml-2 inline-flex items-center gap-1 font-semibold underline"
                                >
                                  <RefreshCw size={13} />
                                  Reintentar
                                </button>
                              </div>
                          )}

                          {/* REGISTRO DE NUEVA DIRECCIÓN */}
                          <div className="mt-5">
                            {direcciones.length === 0 && (
                                <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                  Todavía no tienes direcciones guardadas.
                                  Registra una para continuar con el delivery.
                                </p>
                            )}

                            {!mostrarFormularioDireccion ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                      setErrorRegistroDireccion("");
                                      setExitoRegistroDireccion("");
                                      setMostrarFormularioDireccion(true);
                                    }}
                                    className="rounded-xl border border-[#3D7669] px-5 py-3 text-sm font-semibold text-[#3D7669] transition hover:bg-[#F0F7F4]"
                                >
                                  + Registrar nueva dirección
                                </button>
                            ) : (
                                <div className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-[#FAFAF8] p-5">
                                  <h3 className="font-bold text-slate-800">
                                    Nueva dirección de entrega
                                  </h3>

                                  <div>
                                    <label
                                        htmlFor="destinatario"
                                        className="mb-1 block text-sm font-medium text-slate-700"
                                    >
                                      Nombre del destinatario *
                                    </label>

                                    <input
                                        id="destinatario"
                                        type="text"
                                        value={formDireccion.destinatario}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "destinatario",
                                                e.target.value
                                            )
                                        }
                                        maxLength={120}
                                        required
                                        placeholder="Nombres y apellidos"
                                        className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label
                                        htmlFor="telefono-direccion"
                                        className="mb-1 block text-sm font-medium text-slate-700"
                                    >
                                      Teléfono *
                                    </label>

                                    <input
                                        id="telefono-direccion"
                                        type="tel"
                                        inputMode="numeric"
                                        value={formDireccion.telefono}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "telefono",
                                                e.target.value.replace(/\D/g, "").slice(0, 9)
                                            )
                                        }
                                        maxLength={9}
                                        required
                                        placeholder="987654321"
                                        className={inputClass}
                                    />

                                    <p className="mt-1 text-xs text-slate-400">
                                      Ingresa los 9 dígitos de tu teléfono.
                                    </p>
                                  </div>

                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <label
                                          htmlFor="departamento"
                                          className="mb-1 block text-sm font-medium text-slate-700"
                                      >
                                        Departamento *
                                      </label>

                                      <input
                                          id="departamento"
                                          type="text"
                                          value={formDireccion.departamento}
                                          onChange={(e) =>
                                              actualizarCampoDireccion(
                                                  "departamento",
                                                  e.target.value
                                              )
                                          }
                                          maxLength={120}
                                          required
                                          placeholder="Lima"
                                          className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label
                                          htmlFor="provincia"
                                          className="mb-1 block text-sm font-medium text-slate-700"
                                      >
                                        Provincia *
                                      </label>

                                      <input
                                          id="provincia"
                                          type="text"
                                          value={formDireccion.provincia}
                                          onChange={(e) =>
                                              actualizarCampoDireccion(
                                                  "provincia",
                                                  e.target.value
                                              )
                                          }
                                          maxLength={120}
                                          required
                                          placeholder="Lima"
                                          className={inputClass}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label
                                        htmlFor="distrito"
                                        className="mb-1 block text-sm font-medium text-slate-700"
                                    >
                                      Distrito *
                                    </label>

                                    <input
                                        id="distrito"
                                        type="text"
                                        value={formDireccion.distrito}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "distrito",
                                                e.target.value
                                            )
                                        }
                                        maxLength={120}
                                        required
                                        placeholder="Nombre del distrito"
                                        className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label
                                        htmlFor="direccion-completa"
                                        className="mb-1 block text-sm font-medium text-slate-700"
                                    >
                                      Dirección completa *
                                    </label>

                                    <input
                                        id="direccion-completa"
                                        type="text"
                                        value={formDireccion.direccion}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "direccion",
                                                e.target.value
                                            )
                                        }
                                        maxLength={200}
                                        required
                                        placeholder="Avenida, calle, número, urbanización..."
                                        className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label
                                        htmlFor="referencia"
                                        className="mb-1 block text-sm font-medium text-slate-700"
                                    >
                                      Referencia (opcional)
                                    </label>

                                    <textarea
                                        id="referencia"
                                        rows={2}
                                        value={formDireccion.referencia}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "referencia",
                                                e.target.value.slice(0, 200)
                                            )
                                        }
                                        maxLength={200}
                                        placeholder="Frente al parque, casa de portón negro..."
                                        className={inputClass}
                                    />

                                    <p className="mt-1 text-right text-xs text-slate-400">
                                      {formDireccion.referencia.length}/200
                                    </p>
                                  </div>

                                  <label className="flex items-center gap-3 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formDireccion.predeterminada}
                                        onChange={(e) =>
                                            actualizarCampoDireccion(
                                                "predeterminada",
                                                e.target.checked
                                            )
                                        }
                                        className="h-4 w-4 accent-[#3D7669]"
                                    />

                                    Establecer como dirección predeterminada
                                  </label>

                                  {errorRegistroDireccion && (
                                      <p
                                          role="alert"
                                          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                                      >
                                        {errorRegistroDireccion}
                                      </p>
                                  )}

                                  <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={guardarDireccion}
                                        disabled={guardandoDireccion}
                                        className="rounded-xl bg-[#3D7669] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {guardandoDireccion
                                          ? "Guardando..."
                                          : "Guardar dirección"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                          setMostrarFormularioDireccion(false);
                                          setErrorRegistroDireccion("");
                                        }}
                                        disabled={guardandoDireccion}
                                        className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-slate-600"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                            )}

                            {exitoRegistroDireccion && (
                                <p
                                    role="status"
                                    className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
                                >
                                  {exitoRegistroDireccion}
                                </p>
                            )}
                          </div>
                        </div>
                    )}

                    <div className="mt-5">
                      <label
                          htmlFor="observaciones"
                          className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Observaciones (opcional)
                      </label>

                      <textarea
                          id="observaciones"
                          value={observaciones}
                          onChange={(e) =>
                              setObservaciones(
                                  e.target.value.slice(0, 500)
                              )
                          }
                          maxLength={500}
                          rows={3}
                          placeholder="Indicaciones adicionales para tu pedido..."
                          className={inputClass}
                      />

                      <p className="mt-1 text-right text-xs text-slate-400">
                        {observaciones.length}/500 caracteres
                      </p>
                    </div>
                  </section>

                  {/* MÉTODO DE PAGO */}
                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800">
                      3. Método de pago
                    </h2>

                    <div className="mt-5 space-y-3">
                      {opcionesPago.map((opcion) => {
                        const Icono = opcion.icono;

                        return (
                            <label
                                key={opcion.codigo}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                    paymentMethod === opcion.codigo
                                        ? "border-[#3D7669] bg-[#F0F7F4]"
                                        : "border-stone-200"
                                }`}
                            >
                              <input
                                  type="radio"
                                  name="payment"
                                  value={opcion.codigo}
                                  checked={
                                      paymentMethod === opcion.codigo
                                  }
                                  onChange={() =>
                                      setPaymentMethod(
                                          opcion.codigo
                                      )
                                  }
                              />

                              <Icono
                                  size={20}
                                  className="shrink-0 text-[#3D7669]"
                              />

                              <div>
                                <p className="font-medium text-slate-800">
                                  {opcion.nombre}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {opcion.descripcion}
                                </p>
                              </div>
                            </label>
                        );
                      })}
                    </div>

                    {paymentMethod === "CONTRAENTREGA" && (
                        <p className="mt-3 rounded-lg bg-[#F0F7F4] p-3 text-sm text-[#254E46]">
                          El pedido quedará pendiente de pago hasta
                          que el personal confirme el cobro.
                        </p>
                    )}

                    {paymentMethod === "EFECTIVO_TIENDA" && (
                        <p className="mt-3 rounded-lg bg-[#F0F7F4] p-3 text-sm text-[#254E46]">
                          El pago se realizará en efectivo al recoger
                          tus libros.
                        </p>
                    )}

                    {paymentMethod === "TARJETA_TIENDA" && (
                        <p className="mt-3 rounded-lg bg-[#F0F7F4] p-3 text-sm text-[#254E46]">
                          El pago se realizará con tarjeta directamente
                          en la tienda.
                        </p>
                    )}

                    {paymentMethod === "PAGO_ONLINE" && (
                        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                          Se ejecutará una simulación de pago aprobada
                          por el backend. No ingreses datos de tarjetas
                          ni se realizará un cobro real.
                        </p>
                    )}
                  </section>
                </div>

                {/* RESUMEN */}
                <aside className="rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    Resumen del pedido
                  </h2>

                  <div className="mt-5 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3"
                        >
                          <img
                              src={
                                  item.image ||
                                  "/placeholder-book.svg"
                              }
                              alt={item.title}
                              className="h-16 w-12 rounded object-contain"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {item.title}
                            </p>

                            <p className="text-xs text-slate-500">
                              Cantidad: {item.quantity}
                            </p>
                          </div>

                          <p className="text-sm font-semibold">
                            S/ {(
                              Number(item.price) *
                              Number(item.quantity)
                          ).toFixed(2)}
                          </p>
                        </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm">
                    <div className="flex justify-between">
                      <span>Productos ({totalItems})</span>

                      <span>
                    S/ {Number(totalPrice).toFixed(2)}
                  </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Entrega</span>

                      <span className="text-right text-slate-500">
                    {deliveryType === "recojo"
                        ? "Recojo en tienda"
                        : "Calculado por el servidor"}
                  </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-stone-200 pt-5">
                    <p className="text-xs leading-5 text-slate-500">
                      El total definitivo, el costo de envío y
                      la disponibilidad serán calculados y
                      verificados por Spring Boot.
                    </p>
                  </div>

                  {error && (
                      <p
                          role="alert"
                          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                      >
                        {error}
                      </p>
                  )}

                  <button
                      type="button"
                      onClick={confirmarPedido}
                      disabled={
                          procesando ||
                          items.length === 0 ||
                          (deliveryType === "delivery" &&
                              !direccionId)
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7669] py-3 font-semibold text-white transition hover:bg-[#315e55] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {procesando ? (
                        <>
                          <RefreshCw
                              size={18}
                              className="animate-spin"
                          />
                          Registrando pedido...
                        </>
                    ) : (
                        <>
                          <ShoppingBag size={18} />
                          Confirmar pedido
                        </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-xs text-slate-400">
                    El pedido se registrará en el servidor.
                  </p>
                </aside>
              </div>
          )}
        </main>
      </div>
  );
}