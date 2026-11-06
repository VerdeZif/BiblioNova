
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    ShoppingBag,
    ClipboardList,
    RefreshCw,
    ArrowRight,
    AlertCircle,
    LayoutDashboard,
} from "lucide-react";

import {
    listarVentasVendedor,
    listarPedidosVendedor,
} from "../../services/ventasVendedor";

function extraerLista(respuesta) {
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    if (Array.isArray(respuesta?.contenido)) {
        return respuesta.contenido;
    }

    // Algunos endpoints usan el formato de Spring Page.
    if (Array.isArray(respuesta?.content)) {
        return respuesta.content;
    }

    throw new Error(
        "El servidor devolvió un formato de listado inesperado."
    );
}

function mensajeError(error) {
    if (error?.response?.status === 403) {
        return "El backend no permite consultar este recurso con el rol Vendedor.";
    }

    if (error?.response?.status === 401) {
        return "La sesión ha expirado. Inicia sesión nuevamente.";
    }

    return (
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo consultar la información."
    );
}

function TarjetaResumen({
                            titulo,
                            descripcion,
                            icono: Icono,
                        }) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[#E8F3ED] p-3 text-[#3D7669]">
                    <Icono size={25} />
                </div>

                <div>
                    <h2 className="font-bold text-slate-800">
                        {titulo}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {descripcion}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VendorDashboard() {
    const [ventas, setVentas] = useState([]);
    const [pedidos, setPedidos] = useState([]);

    const [cargando, setCargando] = useState(true);

    const [errorVentas, setErrorVentas] = useState("");
    const [errorPedidos, setErrorPedidos] = useState("");

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        setErrorVentas("");
        setErrorPedidos("");

        const [resultadoVentas, resultadoPedidos] =
            await Promise.allSettled([
                listarVentasVendedor({ page: 0, size: 5 }),
                listarPedidosVendedor({ page: 0, size: 5 }),
            ]);

        if (resultadoVentas.status === "fulfilled") {
            try {
                setVentas(extraerLista(resultadoVentas.value));
            } catch (error) {
                setVentas([]);
                setErrorVentas(mensajeError(error));
            }
        } else {
            setVentas([]);
            setErrorVentas(
                mensajeError(resultadoVentas.reason)
            );
        }

        if (resultadoPedidos.status === "fulfilled") {
            try {
                setPedidos(extraerLista(resultadoPedidos.value));
            } catch (error) {
                setPedidos([]);
                setErrorPedidos(mensajeError(error));
            }
        } else {
            setPedidos([]);
            setErrorPedidos(
                mensajeError(resultadoPedidos.reason)
            );
        }

        setCargando(false);
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    return (
        <main className="mx-auto max-w-6xl px-5 py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#3D7669]">
                        BiblioNova
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-800">
                        Panel del vendedor
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Consulta las ventas y los pedidos registrados
                        en la biblioteca.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={cargarDatos}
                    disabled={cargando}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                    <RefreshCw
                        size={18}
                        className={cargando ? "animate-spin" : ""}
                    />
                    Actualizar
                </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <TarjetaResumen
                    titulo="Ventas"
                    descripcion="Consulta las operaciones de venta registradas."
                    icono={ShoppingBag}
                />

                <TarjetaResumen
                    titulo="Pedidos"
                    descripcion="Seguimiento de pedidos del sistema."
                    icono={ClipboardList}
                />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ShoppingBag
                            size={22}
                            className="text-[#3D7669]"
                        />

                        <h2 className="text-xl font-bold text-slate-800">
                            Ventas recientes
                        </h2>
                    </div>

                    {errorVentas && (
                        <p
                            role="alert"
                            className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                        >
                            <AlertCircle size={18} className="shrink-0" />
                            {errorVentas}
                        </p>
                    )}

                    {cargando && (
                        <p className="mt-5 text-sm text-slate-500">
                            Consultando ventas...
                        </p>
                    )}

                    {!cargando && !errorVentas &&
                        ventas.length === 0 && (
                            <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-slate-500">
                                No se encontraron ventas.
                            </p>
                        )}

                    {!cargando && !errorVentas &&
                        ventas.length > 0 && (
                            <div className="mt-5 space-y-3">
                                {ventas.map((venta, index) => {
                                    const identificador =
                                        venta.ventaId ?? venta.id;

                                    return (
                                        <div
                                            key={identificador ?? index}
                                            className="rounded-xl border border-stone-200 p-4"
                                        >
                                            <p className="font-semibold text-slate-800">
                                                {venta.codigoVenta ||
                                                    (identificador
                                                        ? `Venta #${identificador}`
                                                        : "Venta registrada")}
                                            </p>

                                            {venta.estado && (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Estado: {venta.estado}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    <Link
                        to="/vendedor/ventas"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#3D7669]"
                    >
                        Ver todas las ventas
                        <ArrowRight size={17} />
                    </Link>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ClipboardList
                            size={22}
                            className="text-[#3D7669]"
                        />

                        <h2 className="text-xl font-bold text-slate-800">
                            Pedidos recientes
                        </h2>
                    </div>

                    {errorPedidos && (
                        <p
                            role="alert"
                            className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                        >
                            <AlertCircle size={18} className="shrink-0" />
                            {errorPedidos}
                        </p>
                    )}

                    {cargando && (
                        <p className="mt-5 text-sm text-slate-500">
                            Consultando pedidos...
                        </p>
                    )}

                    {!cargando && !errorPedidos &&
                        pedidos.length === 0 && (
                            <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-slate-500">
                                No se encontraron pedidos.
                            </p>
                        )}

                    {!cargando && !errorPedidos &&
                        pedidos.length > 0 && (
                            <div className="mt-5 space-y-3">
                                {pedidos.map((pedido, index) => {
                                    const identificador =
                                        pedido.pedidoId ?? pedido.id;

                                    return (
                                        <div
                                            key={identificador ?? index}
                                            className="rounded-xl border border-stone-200 p-4"
                                        >
                                            <p className="font-semibold text-slate-800">
                                                {pedido.codigoPedido ||
                                                    (identificador
                                                        ? `Pedido #${identificador}`
                                                        : "Pedido registrado")}
                                            </p>

                                            {pedido.estado && (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Estado: {pedido.estado}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </section>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex items-start gap-3">
                    <LayoutDashboard
                        size={22}
                        className="shrink-0 text-[#3D7669]"
                    />
                    <div>
                        <p className="font-semibold text-slate-800">
                            Información conectada al backend
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Esta pantalla consulta ventas y pedidos reales.
                            Las operaciones que puede realizar el vendedor
                            dependen de los permisos configurados en Spring Boot.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
