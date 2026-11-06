# BiblioNova — Frontend

Interfaz web de **BiblioNova**, sistema de librería y biblioteca con catálogo público, compra y seguimiento de pedidos, préstamos y reservas, gestión de inventario y ventas, y paneles separados por rol.

> **Estado del proyecto:** alcance funcional acordado implementado y comprobado por el equipo en el entorno local. Este README describe la integración real con el backend; **no utiliza los antiguos servicios de demostración**. La compilación de producción se verificó con `npm run build`. Esto no sustituye las pruebas de seguridad, rendimiento y despliegue de un entorno productivo.

## 1. Tecnologías y arquitectura

| Capa | Tecnología / responsabilidad |
| --- | --- |
| Frontend | React, Vite, JavaScript y JSX |
| Navegación | React Router |
| Estilos | Tailwind CSS y utilidades CSS existentes |
| Iconografía | `lucide-react` |
| Comunicación HTTP | Axios (`src/services/api.js`) |
| Autenticación | JWT; usuario/token conservados en `sessionStorage` durante la sesión |
| Backend | Java 17, Spring Boot, Spring Security, JPA/Hibernate |
| Base de datos | MySQL/MariaDB (gestionada por el backend) |
| Documentación API | Swagger UI del backend |

**Flujo de datos:** `Página/Componente React → servicio de frontend → Axios → /api/... → Spring Boot → base de datos`. El navegador **no** se conecta directamente a MySQL.

Los datos de catálogo, pedidos, préstamos, reservas, usuarios, ventas e inventario provienen de la API. El carrito y algunos estados de interfaz pueden mantenerse localmente mientras se navega; **no son sustitutos de la información oficial del backend**.

## 2. Requisitos para ejecutar el frontend

- Node.js y npm, en versiones compatibles con `package.json` y con la versión de Vite instalada. Comprueba `node --version` y `npm --version`.
- IntelliJ IDEA (u otro editor), terminal PowerShell y navegador actualizado.
- Backend BiblioNova funcionando y base de datos configurada. En el entorno de desarrollo compartido, la API se ejecuta en `http://localhost:8080/api` y el frontend en `http://localhost:5173`.
- Ejecutar la instalación de dependencias en la carpeta `frontend`, no en la raíz del proyecto.

### Instalación y ejecución con IntelliJ IDEA

Abre el proyecto BiblioNova en IntelliJ IDEA y, en **View → Tool Windows → Terminal**:

```powershell
cd frontend
npm install
```

Si el proyecto incluye `package-lock.json` y necesitas una instalación reproducible, puedes usar `npm ci` en lugar de `npm install`.

Crea o revisa `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

> El frontend utiliza la API real. **No activar `VITE_USE_MOCKS=true`**: el modo de demostración ya no forma parte del flujo funcional. `USE_MOCKS=false` puede mantenerse temporalmente como constante de compatibilidad mientras se limpia el código.

Inicia el servidor de desarrollo:

```powershell
npm run dev
```

Abre la URL indicada por Vite (normalmente `http://localhost:5173`). Para comprobar una compilación de producción:

```powershell
npm run build
```

La compilación observada generó `dist/` correctamente. Vite emitió una **advertencia**, no un error, porque el bundle JavaScript principal superaba 500 kB; hay oportunidad de optimizar con separación de código y carga diferida.

Antes de usar comandos como `npm run lint` o `npm run preview`, confirma que estén declarados en `frontend/package.json`.

### Arranque del backend

En una terminal separada, inicia Spring Boot según el mecanismo configurado en el repositorio (por ejemplo, la ejecución de la aplicación desde IntelliJ o el wrapper Maven si está incluido). Comprueba que `http://localhost:8080/swagger-ui/index.html` responda y que la base de datos esté disponible. El backend de desarrollo compartido usaba el puerto MySQL `3307`; verifica este dato en su configuración local.

**No subir al repositorio** claves JWT, contraseñas, tokens de sesión, archivos `.env.local` con secretos ni credenciales de MySQL. `VITE_*` es configuración **pública** incorporada al bundle: no almacenar secretos en esas variables. Las credenciales vistas durante el desarrollo deben rotarse antes de compartir o desplegar el sistema.

## 3. Roles y acceso

| Rol | Panel principal | Funcionalidades principales |
| --- | --- | --- |
| **Administrador** | `/admin` | Dashboard, libros, pedidos, ventas, inventario, usuarios y lectores; puede acceder a operaciones bibliotecarias |
| **Bibliotecario** | `/bibliotecario` | Dashboard, gestión de préstamos, devoluciones y reservas |
| **Vendedor** | `/vendedor` | Dashboard, consulta de ventas, pedidos, cobros y venta presencial |
| **Cliente** | `/mi-cuenta` | Cuenta, direcciones, catálogo, carrito, pedidos propios, préstamos y reservas propios |

Las pestañas **Mis pedidos** y **Mis préstamos** son personales del rol Cliente; los otros roles utilizan sus **pantallas de gestión**. No se deben habilitar páginas solo mostrando botones: `ProtectedRoute` controla la navegación y **Spring Security vuelve a validar el permiso en cada endpoint**.

`src/utils/roles.js` define la ruta principal por rol. La pantalla de login recupera una ruta protegida solicitada previamente cuando el rol autenticado tiene permiso; de lo contrario redirige al panel propio.

### Rutas principales

**Públicas:** `/`, `/catalogo`, `/libro/:id`, `/carrito`, `/login`, `/registro`.

**Cliente:** `/mi-cuenta`, `/checkout`, `/pedido-confirmado`, `/mis-pedidos`, `/mis-pedidos/:id`, `/mis-prestamos`.

**Bibliotecario (y Administrador):** `/bibliotecario`, `/bibliotecario/prestamos`, `/bibliotecario/reservas`.

**Vendedor:** `/vendedor`, `/vendedor/ventas`, `/vendedor/pedidos`, `/vendedor/nueva-venta`.

**Administrador:** `/admin`, `/admin/libros`, `/admin/pedidos`, `/admin/ventas`, `/admin/inventario`, `/admin/usuarios`, `/admin/lectores`.

`/admin/ventas` reutiliza la vista de consulta de ventas bajo `AdminLayout`. Los módulos de préstamo y reserva comparten el layout bibliotecario; cuando accede un administrador se muestra el enlace para regresar a `/admin`.

## 4. Funcionalidades implementadas

### Catálogo y compra

- Listado y detalle de libros desde Spring Boot, con portada, autores, editorial, categoría, precio y stock disponible.
- Carrito y checkout; validación de cantidades y disponibilidad real en el backend.
- Creación y seguimiento de pedidos de **Recojo** y **Delivery**; direcciones administradas desde la cuenta del cliente.
- Métodos de pago sujetos al tipo de entrega, según reglas del backend. La integración `PAGO_ONLINE` observada en el desarrollo es **simulada**; no representa una pasarela bancaria real.

### Préstamos y reservas

- Cliente consulta préstamos y reservas propios y solicita reservas según condiciones de ejemplares y lector.
- Bibliotecario administra préstamos, devoluciones y reservas; el dashboard obtiene datos reales.
- Administrador accede a estas operaciones con sus permisos correspondientes.

### Ventas, pedidos e inventario

- Vendedor registra ventas presenciales, busca ejemplares disponibles y consulta detalles y pagos reales.
- Confirmación de cobros antes de entregar pedidos de pago en tienda o contraentrega.
- Flujo de **Recojo**: `Pendiente → Confirmado → Preparando → ListoRecojo → Entregado`.
- Flujo de **Delivery**: `Pendiente → Confirmado → Preparando → Despachado → Entregado`.
- Entrega requiere **pago confirmado** y campo **recibidoPor**; al entregar, el backend registra la venta asociada al pedido.
- La cancelación depende del estado y del pago; el backend impide cancelar pedidos que requerirían una devolución de dinero no implementada.
- Inventario administra ejemplares, proveedores, ubicaciones, recepciones, disponibilidad y movimientos mediante permisos de cada rol.
- Dashboard administrativo consulta indicadores desde la API, no desde archivos Demo.

> Las reglas de negocio y las transiciones deben mantenerse en Spring Boot. La interfaz puede orientar o deshabilitar acciones inválidas, pero **no puede sustituir la validación del servidor**.

## 5. Organización del frontend (carpetas relevantes)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── auth/                 # AuthLayout
│   │   ├── layout/               # Navbar y layouts por rol
│   │   ├── cuenta/               # Direcciones y componentes de cuenta
│   │   └── ProtectedRoute.jsx
│   ├── context/                  # AuthContext, CartContext
│   ├── pages/
│   │   ├── public/               # Inicio, catálogo, detalle, carrito, cuenta, pedidos
│   │   ├── auth/                 # Login y registro
│   │   ├── admin/                # Dashboard y administración
│   │   ├── bibliotecario/        # Préstamos y reservas
│   │   └── vendedor/             # Ventas, pedidos y venta presencial
│   ├── services/                 # Axios y servicios por dominio
│   │   ├── api.js
│   │   ├── catalogo.js
│   │   ├── catalogoApi.js
│   │   └── ...
│   ├── utils/                    # roles.js, utilidades
│   └── ...
├── public/                       # Recursos estáticos, si aplica
├── package.json
└── README.md
```

Los nombres son una guía basada en los archivos revisados; consulta el árbol actual en IntelliJ para nuevas carpetas o movimientos.

### Archivos y responsabilidades esenciales

- `src/services/api.js`: instancia Axios, URL base, cabecera Bearer, interceptores de respuesta, login, registro, cierre de sesión y recuperación del usuario.
- `src/context/AuthContext.jsx`: expone `usuario`, `cargando`, `login`, `logout` y sincronización de sesión.
- `src/components/ProtectedRoute.jsx`: controla el acceso por rol y la redirección.
- `src/utils/roles.js`: panel por defecto de cada rol.
- `src/services/catalogoApi.js`: consume y adapta los libros del backend; `listarLibros()` devuelve libros en el formato de React.
- `src/services/catalogo.js`: delega en `listarLibros()` y no debe volver a introducir fallback a `librosAdminDemo.js`.
- `src/pages/admin/AdminOrdersPage.jsx`: reutiliza la gestión real de pedidos; no debe usar `pedidosDemo.js`.

## 6. Contrato de integración: no romperlo

- **API base:** `import.meta.env.VITE_API_URL || "http://localhost:8080/api"`.
- **JWT:** Axios envía `Authorization: Bearer <token>`; nunca mostrar tokens en interfaz o capturas compartidas.
- **Paginación:** el backend utiliza frecuentemente `{ contenido, pagina, tamano, totalElementos, totalPaginas }`. No confundir número de filas cargadas con el total global.
- **Libro adaptado:** `{ id, title, author, category, price, image, saleable, loanable, stockVenta, stockPrestamo, ... }`.
- **Estados de pedido:** `Pendiente`, `Confirmado`, `Preparando`, `ListoRecojo`, `Despachado`, `Entregado`, `Cancelado` (respetar mayúsculas exactas).
- **Formularios de pago:** no marcar una operación como pagada hasta confirmar el cobro real o recibir la confirmación del flujo correspondiente; `PAGO_ONLINE` se maneja por el flujo simulado del backend en este entorno.
- **Errores:** `401` = sesión no válida; `403` = acceso no autorizado y **no debe cerrar la sesión**. Errores de conexión no deben eliminar el usuario guardado.
- **Datos:** nunca usar `localStorage` para simular pedidos, usuarios, stock o préstamos oficiales.

Si se modifica un DTO Java, revisar los consumidores de frontend antes de cambiar nombres o campos. No suponer formas de respuesta sin consultar el DTO o Swagger.

## 7. Pruebas manuales de regresión

1. Abrir `/`, `/catalogo` y `/libro/:id` con datos reales; comprobar imágenes y stock.
2. Iniciar sesión y cerrar sesión con cada rol; confirmar ruta principal correcta y enlaces de navegación.
3. Entrar a `/admin/usuarios` con Cliente o Vendedor: acceso bloqueado; confirmar también bloqueo del endpoint en Spring Boot.
4. Crear un pedido de **prueba** desde Cliente y verificar que aparece en los paneles de gestión.
5. Confirmar pedido y cobro; entregar con `recibidoPor`; verificar creación de venta y actualización del ejemplar.
6. Verificar cancelar un pedido elegible sin pagos confirmados; no modificar pedidos reales de clientes durante pruebas.
7. Probar préstamo, reserva, devolución y las listas del cliente.
8. Verificar dashboards y totales después de actualizar registros.
9. Simular un `401` de sesión expirada y un `403` por rol; comprobar que no se confunden.
10. Ejecutar `npm run build` tras cada cambio relevante.

### Eliminación de código Demo

Los antiguos módulos `librosAdminDemo.js`, `pedidosDemo.js`, `prestamosDemo.js`, `usuariosDemo.js` y `data/books.js` eran artefactos de prueba y se retiraron del flujo funcional. Antes de borrarlos del repositorio, buscar importaciones desde la raíz de `frontend`:

```powershell
Get-ChildItem -Path .\src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
  Select-String -Pattern 'pedidosDemo|prestamosDemo|usuariosDemo|librosAdminDemo|data/books'
```

Una referencia dentro del mismo conjunto de archivos Demo no implica que siga en uso; lo importante es verificar las importaciones de los componentes reales y después compilar. No borrar archivos masivamente sin probar `npm run build`.

## 8. Diseño actual y colaboración

Identidad visual predominante: **verde** `#3D7669`, **fondo crema claro** `#F8F6F1`, tarjetas blancas, navegación lateral por rol, iconos de `lucide-react` y utilidades de Tailwind CSS.

Para una mejora estética, consultar **`GUIA_DISENO_VISUAL.md`**: incluye alcance seguro, componentes priorizados, criterios responsivos, accesibilidad, pruebas de regresión y pautas para entregar cambios sin tocar la lógica de negocio.

### Recomendaciones de trabajo en equipo

- Crear una rama para cambios de diseño, por ejemplo `feature/mejora-ui`.
- Evitar cambios de endpoints, DTO, roles, servicios y transiciones mientras se trabaja únicamente el diseño.
- Dividir los cambios por componente o página; realizar commits pequeños con mensajes claros.
- Compartir capturas en escritorio y móvil y el resultado de `npm run build` antes de integrar cambios.
- Verificar los cambios con datos reales y con los cuatro roles.

## 9. Problemas habituales

| Problema | Comprobación |
| --- | --- |
| Pantalla blanca tras borrar archivos | Revisar errores de Vite y `npm run build`; buscar `import` a módulos inexistentes |
| `401 Unauthorized` | Token expirado/incorrecto; volver a iniciar sesión |
| `403 Forbidden` | Verificar rol autorizado, anotaciones del backend y autoridad JWT; no quitar seguridad a ciegas |
| Catálogo vacío | Backend activo, `VITE_API_URL`, respuesta de `/api/catalogo/libros`, filtros y transformaciones |
| No aparecen todos los registros | Revisar paginación y `totalElementos`; no usar `contenido.length` como total general |
| CORS en desarrollo | Comprobar origen exacto `http://localhost:5173` en configuración Spring Boot |
| Advertencia de bundle >500 kB | No bloquea build; planificar lazy loading y fragmentación del JS |

## 10. Alcance y siguientes mejoras opcionales

El sistema cumple el alcance funcional acordado y comprobado por el equipo. Para una posible puesta en producción, valorar pruebas automatizadas, accesibilidad, rendimiento, manejo de errores, rotación de credenciales, configuración segura de entornos, despliegue y una pasarela de pagos real si se requiere.

**Importante:** la modalidad de pago en línea observada durante el desarrollo es **simulación**, por lo que no debe documentarse como cobro bancario real.
