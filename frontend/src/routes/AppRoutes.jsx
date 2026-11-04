import MyLoansPage from "../pages/public/MyLoansPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import CatalogPage from "../pages/public/CatalogPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import BookDetailPage from "../pages/public/BookDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";
import OrderConfirmationPage from "../pages/public/OrderConfirmationPage";
import MyOrdersPage from "../pages/public/MyOrdersPage";
import OrderDetailPage from "../pages/public/OrderDetailPage";
import LoansManagementPage from "../pages/bibliotecario/LoansManagementPage";
import BibliotecarioLayout from "../components/layout/BibliotecarioLayout";
import BibliotecarioDashboard from "../pages/bibliotecario/BibliotecarioDashboard";
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminBooksPage from "../pages/admin/AdminBooksPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";

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
        <Route path="/pedido-confirmado" element={<OrderConfirmationPage />}/>
        <Route path="/mis-pedidos" element={<MyOrdersPage />} />
        <Route path="/mis-pedidos/:id" element={<OrderDetailPage />} />
        <Route path="/mis-prestamos" element={<MyLoansPage />} />
<Route
  path="/bibliotecario"
  element={<BibliotecarioLayout />}
>
  <Route index element={<BibliotecarioDashboard />} />
  <Route
    path="prestamos"
    element={<LoansManagementPage />}
  />
</Route>

<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />

  <Route path="libros" element={<AdminBooksPage />} />

  <Route path="pedidos" element={<AdminOrdersPage />} />
<Route path="inventario" element={<AdminInventoryPage />} />

  <Route
    path="usuarios"
    element={<AdminUsersPage />}
  />
</Route>

        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        {/* Clientes */}
        <Route path="/mi-cuenta" element={<Placeholder title="Mi cuenta" />} />
       

                
        {/* Página no encontrada */}
        <Route path="*" element={<Placeholder title="Página no encontrada" />} />
        <Route path="/libro/:id" element={<BookDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}