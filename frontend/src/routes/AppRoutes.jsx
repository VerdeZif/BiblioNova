import { BrowserRouter, Routes, Route } from "react-router-dom";

function Placeholder({ title }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>

      <p className="mt-3 text-slate-500">
        Módulo en desarrollo
      </p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tienda online */}
        <Route path="/" element={<Placeholder title="Inicio - Biblioteca" />} />
        <Route path="/catalogo" element={<Placeholder title="Catálogo de libros" />} />
        <Route path="/carrito" element={<Placeholder title="Carrito de compras" />} />

        {/* Autenticación */}
        <Route path="/login" element={<Placeholder title="Iniciar sesión" />} />
        <Route path="/registro" element={<Placeholder title="Crear cuenta" />} />

        {/* Clientes */}
        <Route path="/mi-cuenta" element={<Placeholder title="Mi cuenta" />} />
        <Route path="/mis-pedidos" element={<Placeholder title="Mis pedidos" />} />
        <Route path="/mis-prestamos" element={<Placeholder title="Mis préstamos" />} />

        {/* Administración */}
        <Route path="/admin" element={<Placeholder title="Dashboard administrativo" />} />
        <Route path="/admin/libros" element={<Placeholder title="Inventario" />} />
        <Route path="/admin/prestamos" element={<Placeholder title="Préstamos" />} />
        <Route path="/admin/devoluciones" element={<Placeholder title="Devoluciones" />} />
        <Route path="/admin/ventas" element={<Placeholder title="Punto de venta" />} />
        <Route path="/admin/usuarios" element={<Placeholder title="Usuarios" />} />

        {/* Página no encontrada */}
        <Route path="*" element={<Placeholder title="Página no encontrada" />} />
      </Routes>
    </BrowserRouter>
  );
}