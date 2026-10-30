import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import CatalogPage from "../pages/public/CatalogPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import BookDetailPage from "../pages/public/BookDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";

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
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

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
        <Route path="/libro/:id" element={<BookDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}