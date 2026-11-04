# BiblioNova — Frontend

Interfaz web del sistema de gestión de biblioteca y venta de libros. Este directorio contiene **solo el frontend**, desarrollado con React y Vite. La rama documentada es `fornted-limpio`.

> **Estado de integración:** hay funcionalidades de demostración que guardan información en el navegador. No se debe asumir que los pedidos, préstamos, usuarios o inventario ya estén conectados a Spring Boot. Este README documenta el código actual, no certifica una integración completa.

## Tecnologías

- React 19 y React DOM
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- Axios (cliente HTTP)
- Lucide React (iconos)
- Oxlint

## Ejecutar localmente

Desde la carpeta `frontend`:

```bash
npm install
npm run dev
```

Abrir la dirección que indique Vite (habitualmente `http://localhost:5173`).

Otros comandos:

```bash
npm run build
npm run preview
npm run lint
```

## Configuración de entorno

Crear o editar `frontend/.env`:

```dotenv
VITE_USE_MOCKS=true
VITE_API_URL=http://localhost:8080/api
```

- `VITE_USE_MOCKS=true` (o variable ausente): el catálogo y el inicio de sesión utilizan implementaciones demo.
- `VITE_USE_MOCKS=false`: el catálogo intenta consultar Spring Boot y el login usa la API real.
- `VITE_API_URL`: URL base de Axios, por defecto `http://localhost:8080/api`.

**Importante:** cambiar `VITE_USE_MOCKS` a `false` **no conecta automáticamente toda la aplicación**. Por ejemplo, el checkout todavía llama directamente a `crearPedidoDemo` y el carrito consulta el inventario demo.

Reiniciar Vite después de cambiar el archivo `.env`.

## Organización y responsabilidad de archivos

### Archivos base

| Archivo | Responsabilidad |
| --- | --- |
| `package.json` | Dependencias y comandos de desarrollo, compilación y lint. |
| `src/main.jsx` | Punto de entrada de React; monta `App` dentro de `CartProvider`. |
| `src/App.jsx` | Componente principal de la aplicación. |
| `src/index.css` | Estilos globales y configuración visual. |
| `src/routes/AppRoutes.jsx` | Define las rutas públicas, de cliente, bibliotecario y administrador. |
| `src/data/books.js` | Libros iniciales que sirven de semilla al catálogo demo. |

### `src/pages/public/` — vistas de cliente

| Archivo | Responsabilidad |
| --- | --- |
| `HomePage.jsx` | Página de inicio y libros destacados. |
| `CatalogPage.jsx` | Listado de libros del catálogo. |
| `BookDetailPage.jsx` | Detalle del libro, compra y solicitud de préstamo. |
| `CartPage.jsx` | Visualización y edición del carrito. |
| `CheckoutPage.jsx` | Datos de compra, entrega y creación de pedido **demo**. |
| `OrderConfirmationPage.jsx` | Confirmación visual después del checkout. |
| `MyOrdersPage.jsx` | Consulta de pedidos registrados en la demo. |
| `OrderDetailPage.jsx` | Detalle de un pedido. |
| `MyLoansPage.jsx` | Consulta de solicitudes de préstamo. |

### `src/pages/auth/` — autenticación

| Archivo | Responsabilidad |
| --- | --- |
| `LoginPage.jsx` | Formulario de acceso; elige login demo o API según `USE_MOCKS`. |
| `RegisterPage.jsx` | Formulario de registro; requiere revisar su integración real. |

### `src/pages/admin/` — administración

| Archivo | Responsabilidad |
| --- | --- |
| `AdminDashboard.jsx` | Resumen administrativo. |
| `AdminBooksPage.jsx` | Gestión de libros. |
| `AdminInventoryPage.jsx` | Vista de inventario. |
| `AdminOrdersPage.jsx` | Gestión de pedidos y cambios de estado. |
| `AdminUsersPage.jsx` | Gestión de usuarios demo. |

### `src/pages/bibliotecario/` — bibliotecario

| Archivo | Responsabilidad |
| --- | --- |
| `BibliotecarioDashboard.jsx` | Panel del bibliotecario. |
| `LoansManagementPage.jsx` | Revisión y actualización de solicitudes de préstamo. |

### `src/components/` — piezas reutilizables

- `layout/Navbar.jsx`: navegación principal y controles de sesión.
- `layout/AdminLayout.jsx`: estructura del panel administrador.
- `layout/BibliotecarioLayout.jsx`: estructura del panel bibliotecario.
- `auth/AuthLayout.jsx`: estructura visual de login y registro.
- `books/BookCard.jsx`: tarjeta reutilizable de libro.
- `books/BookPurchaseDrawer.jsx`: panel de selección de compra de un libro.
- Otros componentes de esta carpeta aportan interfaz y reutilización; consultar sus importaciones para identificar dónde se utilizan.

### `src/context/`

| Archivo | Responsabilidad |
| --- | --- |
| `CartContext.jsx` | Estado global del carrito, cantidades, totales y persistencia en `localStorage`. Actualmente consulta `librosAdminDemo.js` para validar stock. |

### `src/services/` — datos y conexión

| Archivo | Responsabilidad |
| --- | --- |
| `api.js` | Instancia Axios, URL base, token Bearer desde `sessionStorage`, login real `POST /auth/login` y cierre de sesión. |
| `catalogo.js` | Selecciona catálogo demo o API real; adapta la respuesta del backend al modelo usado por las tarjetas. |
| `librosAdminDemo.js` | CRUD demo de libros y stock de venta/préstamo en `localStorage`. |
| `pedidosDemo.js` | Pedidos demo, validación de stock, descuento al comprar, cambios de estado y reposición al cancelar. |
| `prestamosDemo.js` | Solicitudes demo, aprobación/rechazo/devolución y ajustes de stock de préstamo. |
| `usuariosDemo.js` | Usuarios demo, CRUD, login simulado y sesión en navegador. |

## Rutas principales

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio |
| `/catalogo` | Catálogo |
| `/libro/:id` | Detalle del libro |
| `/carrito` | Carrito |
| `/checkout` | Finalizar compra |
| `/pedido-confirmado` | Confirmación |
| `/mis-pedidos` | Pedidos del cliente |
| `/mis-pedidos/:id` | Detalle del pedido |
| `/mis-prestamos` | Préstamos del cliente |
| `/login` | Inicio de sesión |
| `/registro` | Registro |
| `/mi-cuenta` | **Placeholder**: módulo en desarrollo |
| `/admin` | Dashboard administrador |
| `/admin/libros` | Gestión de libros |
| `/admin/inventario` | Inventario |
| `/admin/pedidos` | Pedidos |
| `/admin/usuarios` | Usuarios |
| `/bibliotecario` | Dashboard bibliotecario |
| `/bibliotecario/prestamos` | Gestión de préstamos |

Las rutas del panel están declaradas en `AppRoutes.jsx`. **No se debe considerar que tienen autorización por roles validada en el servidor** por el hecho de existir sus pantallas.

## Cuentas de prueba (solo demo)

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `demo1234` | Administrador |
| `bibliotecario` | `demo1234` | Bibliotecario |
| `cliente` | `demo1234` | Cliente |

No hay autenticación segura en `usuariosDemo.js`: la contraseña es fija para la demostración. No utilizar este mecanismo en producción.

## Datos guardados en el navegador

| Clave | Contenido |
| --- | --- |
| `biblionova_libros_admin_demo` | Libros y stock demo |
| `biblionova_pedidos_demo` | Pedidos demo |
| `biblionova_prestamos_demo` | Préstamos demo |
| `biblionova_usuarios_demo` | Usuarios demo |
| `biblionova_cart` | Carrito |
| `biblionova_usuario` (`sessionStorage`) | Usuario de sesión |
| `biblionova_token` (`sessionStorage`) | Token devuelto por login real |

Estos datos **no son compartidos entre equipos** y no sustituyen PostgreSQL. Si se borran los datos del navegador, puede perderse el estado de demostración.

## Guía de integración con Spring Boot

### Puntos de entrada existentes

1. `src/services/api.js` centraliza las peticiones HTTP y el encabezado `Authorization: Bearer ...`.
2. `src/services/catalogo.js` ya contiene una llamada `GET /catalogo/libros?size=100` cuando `VITE_USE_MOCKS=false`.
3. `src/services/api.js` implementa `POST /auth/login`, enviando `{ usuario, contrasena }` y esperando `{ token, usuario }`.
4. `adaptLibro()` en `catalogo.js` transforma campos como `libroId`, `titulo`, `autores`, `categoria`, `precioVenta`, `imagenPortada` y `stock` a `id`, `title`, `author`, `category`, `price`, `image`, `stockVenta` y `stockPrestamo`.

### Contrato esperado actualmente por el catálogo

La respuesta de `GET /catalogo/libros` debe exponer una lista en `contenido`, `content` o `items`. Cada elemento se adapta aproximadamente desde:

```json
{
  "libroId": 1,
  "titulo": "Ejemplo",
  "isbn": "9780000000000",
  "autores": [{"nombre": "Autor"}],
  "categoria": {"nombre": "Categoría"},
  "editorial": {"nombre": "Editorial"},
  "precioVenta": 25,
  "imagenPortada": "/portada.jpg",
  "prestamoHabilitado": true,
  "ventaHabilitada": true,
  "stock": {
    "disponiblesVenta": 10,
    "disponiblesPrestamo": 5
  }
}
```

Este JSON es **el formato que el adaptador del frontend espera**, no una confirmación de que el backend actual lo devuelva exactamente así.

### Trabajo pendiente de integración

- Comparar los endpoints y DTO reales del backend con las estructuras usadas en React.
- Conectar gestión de libros, inventario, pedidos, préstamos y usuarios a los servicios reales.
- Sustituir las llamadas directas a `*Demo.js` en las páginas y en `CartContext.jsx` cuando corresponda.
- Implementar/verificar permisos por rol, expiración de sesión, manejo de errores y validación del lado del servidor.
- Revisar registro, `/mi-cuenta` y pagos: el checkout actual **no procesa pagos online**.
- Configurar CORS en Spring Boot para el origen de Vite y comprobar que `VITE_API_URL` sea correcto.
- Probar los flujos completos con backend y base de datos activos.

### Recomendación de trabajo

**No borrar las pantallas existentes antes de comparar contratos.** Mantener las vistas React, identificar qué servicios consumen datos demo y reemplazarlos gradualmente por funciones HTTP. Si los DTO no coinciden, usar adaptadores en `src/services/` para evitar reescribir los componentes.

## Limitaciones conocidas

- El modo demo no equivale a un sistema multiusuario real.
- El checkout guarda pedidos localmente incluso si se desactiva `VITE_USE_MOCKS`.
- El carrito todavía depende del inventario demo.
- La vista `/mi-cuenta` es un placeholder.
- No se ha validado aquí una integración end-to-end con Spring Boot ni una batería completa de pruebas.

---

**Alcance:** documentación del frontend en la rama `fornted-limpio`. El backend se mantiene como responsabilidad separada del repositorio/proyecto.
