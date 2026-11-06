import MyLoansPage from "../pages/public/MyLoansPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import CatalogPage from "../pages/public/CatalogPage";
import MyAccountPage from "../pages/public/MyAccountPage";
import VendedorLayout from "../components/layout/VendedorLayout";
import VendorDashboard from "../pages/vendedor/VendorDashboard";
import VendorSalesPage from "../pages/vendedor/VendorSalesPage";
import VendorOrdersPage from "../pages/vendedor/VendorOrdersPage";
import VendorNewSalePage from "../pages/vendedor/VendorNewSalePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import BookDetailPage from "../pages/public/BookDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";
import OrderConfirmationPage from "../pages/public/OrderConfirmationPage";
import MyOrdersPage from "../pages/public/MyOrdersPage";
import OrderDetailPage from "../pages/public/OrderDetailPage";
import LoansManagementPage from "../pages/bibliotecario/LoansManagementPage";
import ReservationsManagementPage from "../pages/bibliotecario/ReservationsManagementPage";
import BibliotecarioLayout from "../components/layout/BibliotecarioLayout";
import BibliotecarioDashboard from "../pages/bibliotecario/BibliotecarioDashboard";
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminBooksPage from "../pages/admin/AdminBooksPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminReadersPage from "../pages/admin/AdminReadersPage";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

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
            <AuthProvider>
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalogo" element={<CatalogPage />} />
                    <Route path="/libro/:id" element={<BookDetailPage />} />
                    <Route path="/carrito" element={<CartPage />} />

                    {/* Autenticación */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/registro" element={<RegisterPage />} />

                    {/* Rutas Privadas: Cliente */}
                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <CheckoutPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/pedido-confirmado"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <OrderConfirmationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mis-pedidos"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <MyOrdersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mis-pedidos/:id"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <OrderDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mis-prestamos"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <MyLoansPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mi-cuenta"
                        element={
                            <ProtectedRoute roles={["Cliente"]}>
                                <MyAccountPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Ruta Protegida: Vendedor */}
                    <Route
                        path="/vendedor"
                        element={
                            <ProtectedRoute roles={["Vendedor"]}>
                                <VendedorLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<VendorDashboard />} />
                        <Route path="ventas" element={<VendorSalesPage />} />
                        <Route path="pedidos" element={<VendorOrdersPage />} />
                        <Route path="nueva-venta" element={<VendorNewSalePage />} />
                    </Route>

                    {/* Ruta Protegida: Bibliotecario */}
                    <Route
                        path="/bibliotecario"
                        element={
                            <ProtectedRoute roles={["Administrador", "Bibliotecario"]}>
                                <BibliotecarioLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<BibliotecarioDashboard />} />
                        <Route path="prestamos" element={<LoansManagementPage />} />
                        <Route path="reservas" element={<ReservationsManagementPage />} />
                    </Route>

                    {/* Ruta Protegida: Administrador */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={["Administrador"]}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboard />} />
                        <Route path="libros" element={<AdminBooksPage />} />
                        <Route path="pedidos" element={<AdminOrdersPage />} />
                        <Route path="inventario" element={<AdminInventoryPage />} />
                        <Route path="usuarios" element={<AdminUsersPage />} />
                        <Route path="lectores" element={<AdminReadersPage />} />
                        <Route path="ventas" element={<VendorSalesPage />} />
                    </Route>

                    {/* Página no encontrada */}
                    <Route path="*" element={<Placeholder title="Página no encontrada" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}