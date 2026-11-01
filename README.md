# BiblioNova · Backend (API REST)

Sistema integral para una **biblioteca y librería de libros físicos**: catálogo, inventario por ejemplar, préstamos con devoluciones y multas, reservas, pedidos online (recojo o delivery), ventas en mostrador, auditoría y reportes.

Este documento tiene dos públicos: quien levanta el backend (secciones 1 a 4) y quien construye el **frontend** (secciones 5 a 9, que son el contrato de la API).

> Documentación interactiva con todos los endpoints: `http://localhost:8080/swagger-ui.html`
> Especificación OpenAPI en JSON (sirve para generar tipos o clientes): `http://localhost:8080/v3/api-docs`

---

## Contenido

1. [Stack y requisitos](#1-stack-y-requisitos)
2. [Puesta en marcha](#2-puesta-en-marcha)
3. [Estructura del código](#3-estructura-del-código)
4. [Configuración de negocio](#4-configuración-de-negocio)
5. [Guía de integración para el frontend](#5-guía-de-integración-para-el-frontend)
6. [Referencia de endpoints](#6-referencia-de-endpoints)
7. [Flujos completos por pantalla](#7-flujos-completos-por-pantalla)
8. [Estados y transiciones](#8-estados-y-transiciones)
9. [Reglas de negocio y procesos automáticos](#9-reglas-de-negocio-y-procesos-automáticos)
10. [Pruebas automáticas](#10-pruebas-automáticas)
11. [Decisiones y limitaciones conocidas](#11-decisiones-y-limitaciones-conocidas)
12. [Problemas frecuentes](#12-problemas-frecuentes)

---

## 1. Stack y requisitos

| Componente | Versión / detalle |
|---|---|
| Java | 17 |
| Spring Boot | 4.1.x (Spring Framework 7, Hibernate 7, Jackson 3) |
| Seguridad | Spring Security + JWT (JJWT 0.12.6), sesión sin estado |
| Base de datos | MySQL 8.0.16 o superior (el esquema usa `CHECK`, columnas generadas y JSON) |
| Documentación | springdoc-openapi 2.8.9 (Swagger UI) |
| Compilación | Maven |

Si usas MariaDB (por ejemplo la de XAMPP), verifica con `SELECT VERSION();` que sea 10.6 o superior; Hibernate advierte que versiones menores no están soportadas.

Los precios y montos están en **soles (PEN)**.

---

## 2. Puesta en marcha

### 2.1 Base de datos

1. Ejecuta el script `BiblioNova_MySQL.sql` en tu servidor MySQL. Crea la base `biblionova` y carga los datos iniciales (roles, métodos de pago y una política de préstamo).
2. **No vuelvas a ejecutar el script sobre una base con datos**: los `INSERT` iniciales se duplicarían.
3. Las columnas están en camelCase (`rolId`, `nombreCompleto`...). Por eso la aplicación usa `PhysicalNamingStrategyStandardImpl` (ver `application.yml`). No lo quites.
4. Hibernate solo **valida** el esquema (`ddl-auto: validate`); nunca lo modifica.

### 2.2 Variables de entorno

Configúralas en tu Run Configuration de IntelliJ o en el sistema. **No las escribas en el repositorio.**

| Variable | Para qué | Ejemplo / cómo generarla |
|---|---|---|
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `JWT_SECRET` | Clave para firmar los tokens. Debe estar en **base64** y tener al menos 32 bytes | `openssl rand -base64 48` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial (solo se usa si no hay usuarios) | mínimo 8 caracteres |
| `EVIDENCIAS_DIR` | (Opcional) Carpeta donde se guardan las fotos de evidencia | `C:\biblionova\evidencias` |

### 2.3 `application.yml` de referencia

Ajusta el puerto y el usuario de MySQL según tu instalación.

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/biblionova?useSSL=false&serverTimezone=America/Lima
    username: root
    password: ${DB_PASSWORD}
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 6MB

app:
  jwt:
    secret: ${JWT_SECRET}
    expiracion-minutos: 120
  admin:
    nombre-usuario: admin
    correo: admin@biblionova.pe
    contrasena: ${ADMIN_PASSWORD:}
  almacenamiento:
    directorio: ${EVIDENCIAS_DIR:./data/evidencias}
  evidencias:
    dias-retencion: 365
  reservas:
    horas-retencion: 48
    max-activas-por-lector: 3
  prestamos:
    bloquear-con-multas-pendientes: true
  comercio:
    costo-delivery: 8.00
    impuesto-adicional-porcentaje: 0
    punto-recojo: "Tienda BiblioNova - por definir"
    horas-confirmacion: 24
    horas-recojo: 72
    max-pedidos-pendientes: 3
  pagos:
    simulacion-habilitada: true
```

### 2.4 Arrancar

1. Abre el proyecto en IntelliJ IDEA y espera a que Maven descargue las dependencias.
2. Ejecuta `BiblionovaApplication`. El servidor queda en `http://localhost:8080`.
3. Abre `http://localhost:8080/swagger-ui.html`.

### 2.5 Datos iniciales

Al arrancar por primera vez con la base sin usuarios se crean automáticamente:

| Usuario | Rol | Detalle |
|---|---|---|
| `admin` (configurable) | Administrador | Contraseña = `ADMIN_PASSWORD`. Si esa variable está vacía **no se crea** y verás una advertencia en el log |
| `sistema` | Administrador (inactivo) | Cuenta interna para los procesos automáticos. **No puede iniciar sesión** ni aparece en los listados |

Roles existentes: `Administrador`, `Bibliotecario`, `Vendedor`, `Cliente`.
Métodos de pago (campo `codigo`): `EFECTIVO_TIENDA`, `TARJETA_TIENDA`, `PAGO_ONLINE`, `CONTRAENTREGA`.
Política de préstamo inicial: 7 días, máximo 3 ejemplares, S/ 1.00 de multa por día de retraso.

### 2.6 Probar rápido en Swagger

1. `POST /api/auth/login` con `{"usuario":"admin","contrasena":"<tu ADMIN_PASSWORD>"}`.
2. Copia el `token` de la respuesta, pulsa **Authorize** (candado) y pégalo.
3. Prueba `GET /api/auth/me`: debe devolver tu usuario con rol `Administrador`.

---

## 3. Estructura del código

```
com.example.biblionova
├── config        Seguridad (SecurityConfig, filtro JWT), OpenAPI, anotaciones de roles, DataInitializer
├── common        Excepciones y manejador global de errores, paginación, utilidades, método de pago, almacenamiento de archivos
├── seguridad     Usuarios, roles, login, registro público, administración de usuarios
├── catalogo      Libros, autores, categorías, editoriales
├── inventario    Ubicaciones, proveedores, recepciones, ejemplares y movimientos
├── prestamos     Lectores, políticas, préstamos, devoluciones, multas, pagos de multas, evidencias, reservas
├── comercio      Direcciones, pedidos, envíos, pagos de pedidos, ventas
├── auditoria     Registro de eventos sensibles
└── reportes      Consultas agregadas y exportación CSV
```

Dentro de cada módulo: `controller`, `service`, `repository`, `entity`, `dto`.

---

## 4. Configuración de negocio

Todo esto se cambia en `application.yml` sin tocar código. Excepto la política de préstamo, que vive en la base de datos (tabla `politicasPrestamo`) y se gestiona por API (6.5).

| Clave | Valor por defecto | Efecto |
|---|---|---|
| `app.jwt.expiracion-minutos` | 120 | Duración del token |
| `app.reservas.horas-retencion` | 48 | Tiempo que se guarda un ejemplar reservado antes de liberarlo |
| `app.reservas.max-activas-por-lector` | 3 | Reservas activas simultáneas por lector |
| `app.prestamos.bloquear-con-multas-pendientes` | true | Un lector con multas por pagar no puede pedir préstamos ni reservar |
| `app.comercio.costo-delivery` | 8.00 | Costo fijo de envío |
| `app.comercio.impuesto-adicional-porcentaje` | 0 | Los precios ya incluyen impuestos; se suma este % solo si se necesita |
| `app.comercio.punto-recojo` | texto | Dirección que se muestra en pedidos de recojo |
| `app.comercio.horas-confirmacion` | 24 | Un pedido sin confirmar se cancela solo pasado este tiempo |
| `app.comercio.horas-recojo` | 72 | Plazo para recoger un pedido sin pagar |
| `app.comercio.max-pedidos-pendientes` | 3 | Pedidos pendientes simultáneos por cliente |
| `app.evidencias.dias-retencion` | 365 | Días que se conservan las fotos cuya multa ya está cerrada |
| `app.pagos.simulacion-habilitada` | true | Habilita la pasarela de pago simulada (ver 7.1) |

---

## 5. Guía de integración para el frontend

### 5.1 URL base y CORS

- URL base en desarrollo: `http://localhost:8080`. Todos los endpoints cuelgan de `/api`.
- El backend acepta peticiones desde el origen **`http://localhost:5173`** (el puerto por defecto de Vite), con los métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS` y cualquier encabezado.
- Si el frontend corre en otro origen o puerto, agrégalo en `SecurityConfig.corsConfigurationSource()` (lista `setAllowedOrigins`) y reinicia el backend.
- La autenticación va en el encabezado `Authorization`, **no en cookies**; no hace falta `credentials: 'include'`.
- El encabezado `Content-Disposition` no está expuesto por CORS: al descargar un CSV, ponle tú el nombre al archivo.

Sugerencia: guarda la URL en una variable de entorno de Vite (`VITE_API_URL`).

### 5.2 Autenticación

Se usa un **token JWT** que se envía en cada petición protegida:

```
Authorization: Bearer <token>
```

| Aspecto | Detalle |
|---|---|
| Obtener token | `POST /api/auth/login` |
| Duración | 120 minutos (campo `expiraEnMinutos` de la respuesta) |
| Renovación | **No hay refresh token.** Al expirar, el usuario inicia sesión de nuevo |
| Cerrar sesión | No hay endpoint; basta con descartar el token en el cliente |
| Dónde guardarlo | En memoria o en `sessionStorage` (evita `localStorage` si puedes) |
| Cuenta desactivada | Su token deja de funcionar **de inmediato**, aunque no haya expirado |
| Token inválido en rutas públicas | Se ignora: el catálogo público sigue funcionando aunque envíes un token vencido |

Respuesta del login:

```json
{
  "token": "eyJhbGciOi...",
  "tipo": "Bearer",
  "expiraEnMinutos": 120,
  "usuario": {
    "usuarioId": 1,
    "nombreCompleto": "Administrador del sistema",
    "nombreUsuario": "admin",
    "correo": "admin@biblionova.pe",
    "rol": "Administrador",
    "permisos": []
  }
}
```

Usa `usuario.rol` para decidir qué pantallas mostrar. El campo `permisos` hoy viene vacío: la autorización se hace por rol.

### 5.3 Respuestas y errores

Los errores de negocio y de validación tienen siempre el mismo formato:

```json
{ "estado": 409, "mensaje": "Stock insuficiente de 'Libro X': solo hay 0 disponible(s)", "fecha": "2026-10-31T17:20:00.123" }
```

`mensaje` está en español y pensado para mostrarse al usuario. En errores de validación (400) contiene todos los campos inválidos separados por `;`, por ejemplo `titulo: no debe estar vacío; precioVenta: no debe ser nulo`.

| Código | Significado |
|---|---|
| 200 / 201 / 204 | Éxito (201 al crear, 204 sin cuerpo) |
| 400 | Datos inválidos o regla de entrada incumplida (campo vacío, monto insuficiente, rango de fechas inválido) |
| 401 | Falta el token, expiró o es inválido, o credenciales incorrectas en el login. **Redirige al login.** En este caso el cuerpo puede venir vacío |
| 403 | El usuario no tiene el rol necesario |
| 404 | No existe (también se usa cuando un cliente pide un recurso ajeno, para no revelar que existe) |
| 409 | Conflicto de negocio: sin stock, estado que no permite la acción, duplicado, registro en uso, operación simultánea. **Muestra el `mensaje`** |
| 413 | Archivo mayor a 5 MB |

Una operación simultánea sobre los mismos ejemplares puede dar `409` con el mensaje "Otra operación estaba usando los mismos ejemplares; intenta de nuevo". Es seguro reintentar.

### 5.4 Convenciones de datos

**Paginación.** Los listados paginados reciben `page` (empieza en 0), `size` y `sort=campo,asc|desc`, y devuelven:

```json
{ "contenido": [ ... ], "pagina": 0, "tamano": 12, "totalElementos": 57, "totalPaginas": 5 }
```

Tamaño máximo por página: 50 (ejemplares y auditoría: 100). Un `sort` no permitido se ignora y se usa el orden por defecto, no da error.

**Fechas.** En parámetros de consulta: `yyyy-MM-dd` (ej. `?desde=2026-10-01&hasta=2026-10-31`). En respuestas: fecha `2026-10-31`, fecha y hora `2026-10-31T17:20:00.123456`, **sin zona horaria** (el servidor trabaja en `America/Lima`).

**Dinero.** Números JSON con hasta 2 decimales (`35.9`, no `"35.90"`). Los ceros finales se pierden: formatea siempre en el frontend. Moneda: soles.

**Enumeraciones.** Son cadenas con la **capitalización exacta** de la sección 8 (`ApartadoPedido`, `ListoRecojo`, `Danado`, `Danio`...). Los valores `Danado` y `Danio` se escriben sin ñ a propósito.

**Identificadores.** Números enteros. Referencias a otras entidades llegan como `{ "id": 3, "nombre": "..." }`.

**Búsquedas de texto** (`q`): no distinguen mayúsculas.

### 5.5 Roles y permisos

| Rol | Qué puede hacer |
|---|---|
| **Público** (sin token) | Ver catálogo (libros, categorías, editoriales, autores), iniciar sesión, registrarse como cliente |
| **Cliente** | Sus pedidos y direcciones, pagar en la pasarela simulada, cancelar sus pedidos, sus reservas, sus multas, su ficha de lector, cambiar su contraseña |
| **Vendedor** | Gestionar pedidos, registrar ventas en mostrador, reportes de ventas y pedidos, consultar stock bajo |
| **Bibliotecario** | Administrar catálogo, inventario, recepciones, lectores, préstamos, devoluciones, multas, evidencias y reservas; reportes de préstamos, multas e inventario |
| **Administrador** | Todo lo anterior, más usuarios, políticas de préstamo, auditoría y panel general |

Matriz por área (`✓` = permitido):

| Área | Público | Cliente | Vendedor | Bibliotecario | Administrador |
|---|:-:|:-:|:-:|:-:|:-:|
| Catálogo: consultar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catálogo: crear/editar/gestión | | | | ✓ | ✓ |
| Inventario (ejemplares, recepciones, ubicaciones, proveedores) | | | | ✓ | ✓ |
| Lectores, préstamos, devoluciones, multas, evidencias | | | | ✓ | ✓ |
| Políticas de préstamo: ver | | | | ✓ | ✓ |
| Políticas de préstamo: crear/activar | | | | | ✓ |
| Reservas: crear/cancelar | | ✓ (propias) | | ✓ | ✓ |
| Reservas: listar todas | | | | ✓ | ✓ |
| Direcciones y crear pedidos | | ✓ | | | |
| Pedidos: ver los propios | | ✓ | | | |
| Pedidos: gestionar y ver todos | | | ✓ | | ✓ |
| Ventas en mostrador | | | ✓ | | ✓ |
| Usuarios, auditoría, panel | | | | | ✓ |
| Reportes | ver 6.11 | | | | |

Un cliente solo ve sus propios datos: pedir el pedido o la reserva de otro cliente devuelve 404.

### 5.6 Código de apoyo (JavaScript / Vite)

Cliente HTTP mínimo con manejo de token, errores y archivos:

```js
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
let token = sessionStorage.getItem('token');

export function guardarToken(t) {
  token = t;
  t ? sessionStorage.setItem('token', t) : sessionStorage.removeItem('token');
}

export async function api(ruta, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${ruta}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && token) {           // sesión vencida: volver al login
    guardarToken(null);
    window.location.href = '/login';
    throw new Error('Tu sesión expiró');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.mensaje ?? `Error ${res.status}`), { estado: res.status });
  }
  if (res.status === 204) return null;
  const tipo = res.headers.get('content-type') ?? '';
  return tipo.includes('json') ? res.json() : res;   // archivos: devuelve la Response
}

export async function login(usuario, contrasena) {
  const r = await api('/api/auth/login', { method: 'POST', body: { usuario, contrasena } });
  guardarToken(r.token);
  return r.usuario;
}
```

Descargar el CSV de ventas (un enlace directo no sirve porque no lleva el encabezado `Authorization`):

```js
const res = await api('/api/reportes/ventas/exportar?desde=2026-10-01&hasta=2026-10-31');
const url = URL.createObjectURL(await res.blob());
const a = Object.assign(document.createElement('a'), { href: url, download: 'ventas.csv' });
a.click();
URL.revokeObjectURL(url);
```

Subir una foto de evidencia (`multipart`; **no pongas `Content-Type` a mano**, el navegador lo calcula):

```js
const form = new FormData();
form.append('ejemplarId', 12);
form.append('tipo', 'Devolucion');
form.append('detallePrestamoId', 7);
form.append('descripcion', 'Tapa rota');
form.append('archivo', fileInput.files[0]);
await api('/api/prestamos/evidencias', { method: 'POST', form });
```

Mostrar una foto guardada (el endpoint exige token, así que no sirve como `src` directo):

```js
const res = await api(`/api/prestamos/evidencias/${id}/archivo`);
imagen.src = URL.createObjectURL(await res.blob());
```

Tipos TypeScript de las estructuras comunes:

```ts
interface Pagina<T> { contenido: T[]; pagina: number; tamano: number; totalElementos: number; totalPaginas: number; }
interface ApiError { estado: number; mensaje: string; fecha: string; }
interface ItemRef { id: number; nombre: string; }
```

---

## 6. Referencia de endpoints

Notación: **P** = público, **C** = Cliente, **V** = Vendedor, **B** = Bibliotecario, **A** = Administrador. "Cualquiera" = cualquier usuario con sesión iniciada.
Todos los campos con `?` son opcionales. Los límites de longitud se indican entre paréntesis.

### 6.1 Autenticación y cuenta

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | P | Inicia sesión. Cuerpo `{ usuario, contrasena }` |
| POST | `/api/auth/registro` | P | Registro de cliente. Crea la cuenta y su ficha de lector. Responde 201 con el lector |
| GET | `/api/auth/me` | Cualquiera | Datos del usuario logueado |
| POST | `/api/auth/cambiar-contrasena` | Cualquiera | Cuerpo `{ contrasenaActual, contrasenaNueva }`. Responde 204 |

Cuerpo de `registro`: `nombreUsuario` (3–50), `contrasena` (8–72), `correo`, `documento` (≤25), `nombres` (≤80), `apellidos` (≤100), `telefono?`, `direccion?`.
Si el documento ya existe como lector (por ejemplo lo registraron en mostrador), el registro responde 409: esa cuenta debe vincularse en mostrador, no desde la web.

### 6.2 Administración de usuarios (solo A)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/seguridad/usuarios?q&rol&activo&page&size` | Lista usuarios (nunca incluye `sistema`) |
| GET | `/api/seguridad/roles` | Roles de personal asignables (Administrador, Bibliotecario, Vendedor) |
| POST | `/api/seguridad/usuarios` | Crea personal: `{ nombreUsuario, nombreCompleto, correo, contrasena, rol }` |
| PUT | `/api/seguridad/usuarios/{id}` | `{ nombreCompleto, correo, rol }` |
| PATCH | `/api/seguridad/usuarios/{id}/activo?valor=true\|false` | Activa o desactiva |
| POST | `/api/seguridad/usuarios/{id}/contrasena` | `{ contrasenaNueva }`. Responde 204 |

Reglas: no puedes cambiar tu propio rol ni desactivarte; siempre debe quedar un administrador activo; una cuenta de cliente no cambia de rol.

### 6.3 Catálogo

**Libros**

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/catalogo/libros` | P | Búsqueda paginada, solo libros activos |
| GET | `/api/catalogo/libros/{id}` | P | Detalle de un libro activo |
| GET | `/api/catalogo/libros/gestion` | A, B | Igual que la búsqueda pero incluye inactivos |
| GET | `/api/catalogo/libros/gestion/{id}` | A, B | Detalle incluyendo inactivos |
| POST | `/api/catalogo/libros` | A, B | Crea (201) |
| PUT | `/api/catalogo/libros/{id}` | A, B | Actualiza |
| PATCH | `/api/catalogo/libros/{id}/activo?valor=true\|false` | A, B | Activa o desactiva (los libros no se borran) |

Filtros de búsqueda: `q` (título, ISBN o autor), `categoriaId`, `editorialId`, `autorId`, `precioMin`, `precioMax`, `ventaHabilitada`, `prestamoHabilitado`.
Paginación: `size` por defecto 12 (máx. 50). `sort` permitido: `titulo` (por defecto), `precioVenta`, `fechaRegistro`, `anioPublicacion`.

Cuerpo para crear o actualizar:

```json
{
  "isbn": "9780000000001",
  "titulo": "Título del libro",
  "categoriaId": 1,
  "editorialId": 1,
  "anioPublicacion": 2020,
  "edicion": "2da edición",
  "descripcion": "Texto largo",
  "imagenPortada": "https://.../portada.jpg",
  "precioVenta": 35.90,
  "prestamoHabilitado": true,
  "ventaHabilitada": true,
  "autorIds": [1, 2]
}
```

Obligatorios: `titulo` (≤250), `precioVenta` (≥0), `autorIds` (al menos uno). `isbn` ≤20 y único.

Respuesta de un libro:

```json
{
  "libroId": 5, "isbn": "978...", "titulo": "...", "categoria": { "id": 1, "nombre": "Novela" },
  "editorial": { "id": 1, "nombre": "..." }, "anioPublicacion": 2020, "edicion": "...",
  "descripcion": "...", "imagenPortada": "https://...", "precioVenta": 35.9,
  "prestamoHabilitado": true, "ventaHabilitada": true, "activo": true,
  "autores": [ { "id": 1, "nombre": "Ana Prueba" } ],
  "stock": { "libroId": 5, "disponiblesVenta": 3, "disponiblesPrestamo": 3, "enInventario": 5 }
}
```

`stock.disponiblesVenta` es lo que puedes comprar ahora; úsalo para habilitar "Agregar al carrito". `disponiblesPrestamo` indica si se puede pedir prestado o reservar. `enInventario` cuenta los ejemplares que aún posee la tienda (excluye vendidos y dados de baja).

> `imagenPortada` es solo un texto (URL o ruta). **No existe endpoint para subir portadas**: el frontend debe usar una URL externa.

**Categorías, editoriales y autores**

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/catalogo/categorias` | P | Lista de categorías activas (sin paginar) |
| GET | `/api/catalogo/categorias/gestion` | A, B | Todas, incluidas inactivas |
| POST / PUT / DELETE | `/api/catalogo/categorias[/{id}]` | A, B | `{ nombre (≤100), descripcion?, activa? }`. DELETE responde 204; 409 si hay libros que la usan |
| GET | `/api/catalogo/editoriales` | P | Lista sin paginar |
| POST / PUT / DELETE | `/api/catalogo/editoriales[/{id}]` | A, B | `{ nombre (≤150), pais?, sitioWeb? }` |
| GET | `/api/catalogo/autores?q&page&size` | P | Búsqueda paginada por nombre o apellido |
| GET | `/api/catalogo/autores/{id}` | P | Detalle |
| POST / PUT / DELETE | `/api/catalogo/autores[/{id}]` | A, B | `{ nombres, apellidos?, nacionalidad?, fechaNacimiento?, biografia? }` |

### 6.4 Inventario (A, B)

Un **ejemplar** es una unidad física con su propio código (por ejemplo `REC-2026-000012-D5-001`). El catálogo muestra libros; el inventario controla cada ejemplar.

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST / PUT | `/api/inventario/ubicaciones[/{id}]` | `{ codigo (≤40), descripcion?, activa? }`. GET acepta `?soloActivas=true` |
| GET / POST / PUT | `/api/inventario/proveedores[/{id}]` | `{ razonSocial, documentoFiscal?, contacto?, correo?, telefono?, direccion?, activo? }` |
| POST | `/api/inventario/recepciones` | Registra el ingreso de libros y **genera un ejemplar por unidad** (201) |
| GET | `/api/inventario/recepciones?page&size` | Historial paginado |
| GET | `/api/inventario/recepciones/{id}` | Detalle con los códigos generados |
| GET | `/api/inventario/ejemplares` | Búsqueda paginada (ver filtros abajo) |
| GET | `/api/inventario/ejemplares/{id}` | Detalle |
| GET | `/api/inventario/ejemplares/{id}/movimientos` | Historial completo de cambios de estado |
| POST | `/api/inventario/ejemplares/{id}/cambio-estado` | `{ accion, motivo }` |
| PATCH | `/api/inventario/ejemplares/{id}` | Ubicación, destino, condición. Exige `motivo` |

Filtros de ejemplares: `libroId`, `estado`, `ubicacionId`, `esVendible`, `esPrestamo`, `q` (código o título). Orden fijo por código; `size` hasta 100.

Cuerpo de una recepción:

```json
{
  "tipoOrigen": "Compra",
  "proveedorId": 1,
  "donante": null,
  "documentoReferencia": "F001-123",
  "observaciones": null,
  "lineas": [
    { "libroId": 5, "cantidad": 3, "costoUnitario": 22.50, "ubicacionId": 1,
      "esVendible": true, "esPrestamo": true, "condicionFisica": "Nuevo", "observaciones": null }
  ]
}
```

- `tipoOrigen`: `Compra` (exige `proveedorId` y `costoUnitario` en cada línea), `Donacion` (exige `donante`) u `Otro`.
- `cantidad`: de 1 a 500 por línea, máximo 50 líneas.
- `esVendible` y `esPrestamo` si no se envían heredan la configuración del libro. Un ejemplar debe ser vendible, prestable o ambos.
- Una línea con `condicionFisica: "Danado"` ingresa con estado `Danado`.

`accion` de `cambio-estado`: `REGISTRAR_DANIO`, `REGISTRAR_PERDIDA`, `ENVIAR_A_REPARACION`, `HABILITAR`, `DAR_DE_BAJA`. No se puede aplicar a ejemplares prestados, reservados, apartados por un pedido o vendidos: esos estados se gestionan desde su propio flujo.

### 6.5 Lectores y políticas de préstamo

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/prestamos/lectores/yo` | Cualquiera con ficha de lector | La ficha del usuario logueado (así un cliente obtiene su `lectorId`) |
| GET | `/api/prestamos/lectores?q&page&size` | A, B | Búsqueda por documento, nombre o correo |
| GET | `/api/prestamos/lectores/{id}` | A, B | Detalle |
| POST | `/api/prestamos/lectores` | A, B | Alta en mostrador: `{ documento, nombres, apellidos, correo?, telefono?, direccion? }` (201) |
| PUT | `/api/prestamos/lectores/{id}` | A, B | Actualiza |
| PATCH | `/api/prestamos/lectores/{id}/activo?valor=` | A, B | Activa o desactiva |
| GET | `/api/prestamos/politicas` | A, B | Lista de políticas (una sola está activa) |
| POST | `/api/prestamos/politicas` | A | `{ nombre, diasPrestamo (1–90), maxEjemplares (1–20), tarifaRetrasoDiaria, maxMultaRetraso? }` (201). Nace inactiva |
| POST | `/api/prestamos/politicas/{id}/activar` | A | La activa y desactiva las demás |

Las políticas no se editan: para cambiar una tarifa se crea una nueva y se activa. Así los préstamos ya hechos conservan las condiciones con las que se otorgaron.

### 6.6 Préstamos y devoluciones (A, B)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/prestamos` | Crea un préstamo (201) |
| GET | `/api/prestamos?lectorId&estado&soloVencidos&q&page&size` | Búsqueda paginada. `sort`: `fechaPrestamo` (por defecto, descendente), `fechaVencimiento`, `codigoPrestamo` |
| GET | `/api/prestamos/{id}` | Detalle con ejemplares |
| POST | `/api/prestamos/{id}/devoluciones` | Registra devolución total o parcial (201) |
| POST | `/api/prestamos/{id}/anular` | `{ motivo }`. Solo préstamos `Activo` sin devoluciones |

Crear préstamo:

```json
{ "lectorId": 1, "codigosEjemplar": ["REC-2026-000012-D5-001", "REC-2026-000012-D5-002"], "observaciones": null }
```

Entre 1 y 10 códigos, sin repetir (se escanean los códigos de los ejemplares). Un ejemplar reservado solo puede prestarse al lector que lo reservó.

Registrar devolución:

```json
{
  "lineas": [
    { "codigoEjemplar": "REC-2026-000012-D5-001", "condicionRecibida": "Bueno", "observaciones": null },
    { "codigoEjemplar": "REC-2026-000012-D5-002", "condicionRecibida": "Danado", "observaciones": "Tapa rota" }
  ],
  "observaciones": null
}
```

`condicionRecibida`: `Bueno`, `Regular`, `Danado`, `Perdido`. Daño y pérdida **exigen observaciones**. Es todo o nada: si una línea falla, no se registra ninguna.

La respuesta de un préstamo incluye `vencido` (booleano) y `diasRetraso`. El estado `Vencido` nunca se guarda: se calcula en cada consulta, así que usa esos dos campos para mostrar alertas.

### 6.7 Multas, pagos y evidencias

Las multas se generan **solas** al registrar una devolución:

- **Retraso**: días de retraso × tarifa de la política, con tope por ejemplar si la política lo define. Nace `Pendiente`.
- **Daño o pérdida**: nace `EnRevision` con monto 0. No se cobra hasta que un responsable la evalúe y fije el importe.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/prestamos/multas/mias?page&size` | C | Multas del cliente logueado |
| GET | `/api/prestamos/multas?lectorId&estado&tipo&soloConSaldo&page&size` | A, B | Búsqueda. `sort`: `fechaGeneracion`, `monto` |
| GET | `/api/prestamos/multas/{id}` | A, B | Detalle con pagos y cantidad de evidencias |
| POST | `/api/prestamos/multas/{id}/pagos` | A, B | `{ metodoCodigo, monto, referenciaPago? }` |
| POST | `/api/prestamos/multas/{id}/evaluacion` | A, B | `{ monto, justificacion }`: fija el importe de una multa `EnRevision` |
| POST | `/api/prestamos/multas/{id}/anulacion` | A, B | `{ motivo }`. Solo multas sin pagos |

- `metodoCodigo` de multas: `EFECTIVO_TIENDA` o `TARJETA_TIENDA` (se pagan en tienda).
- Se admiten **pagos parciales**. Un pago nunca puede superar el saldo (409). La respuesta trae `monto`, `pagado` y `saldo`.
- `estado`: `Pendiente`, `Parcial`, `Pagada`, `Anulada`, `EnRevision`.

**Evidencias fotográficas** (A, B)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/prestamos/evidencias` | `multipart/form-data` con `ejemplarId`, `tipo`, `detallePrestamoId?`, `descripcion?`, `archivo` (201) |
| GET | `/api/prestamos/evidencias/ejemplar/{ejemplarId}` | Lista las evidencias de un ejemplar |
| GET | `/api/prestamos/evidencias/{id}/archivo` | Devuelve la imagen. Requiere token |

`tipo`: `Entrega`, `Devolucion`, `Inspeccion`, `Recepcion`. Las de `Entrega` y `Devolucion` requieren `detallePrestamoId` (se obtiene del préstamo). Solo se aceptan **JPG, PNG o WEBP de hasta 5 MB**; el tipo se valida por el contenido real del archivo, no por la extensión. Las fotos son privadas y solo se sirven por este endpoint.

### 6.8 Reservas

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/api/reservas` | C, A, B | `{ libroId, lectorId?, observaciones? }` (201). El cliente reserva siempre para sí mismo; el personal debe indicar `lectorId` |
| GET | `/api/reservas/mias` | C | Reservas del cliente logueado |
| GET | `/api/reservas?lectorId&libroId&estado&page&size` | A, B | Listado general |
| POST | `/api/reservas/{id}/cancelar` | C (propias), A, B | Cancela una reserva `Pendiente` o `Confirmada` |

Funcionamiento: si hay un ejemplar libre, la reserva queda `Confirmada` de inmediato, con `codigoEjemplar` y `fechaExpiracion` (48 horas). Si no hay, queda `Pendiente` en cola por orden de llegada, y pasa a `Confirmada` sola cuando se libera un ejemplar. Si el lector no lo retira a tiempo pasa a `Vencida` y el ejemplar sigue al siguiente de la cola. Al prestarse el libro al lector, queda `Atendida`.
Solo se puede reservar un libro con `prestamoHabilitado`, un lector sin multas pendientes, y sin superar el máximo de reservas activas.

### 6.9 Pedidos online (clientes)

**Direcciones de entrega** (C)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pedidos/direcciones` | Direcciones del cliente (la predeterminada primero) |
| POST | `/api/pedidos/direcciones` | 201. La primera queda como predeterminada |
| PUT | `/api/pedidos/direcciones/{id}` | Actualiza |
| DELETE | `/api/pedidos/direcciones/{id}` | 204 |

Cuerpo: `destinatario` (≤150), `telefono` (≤25), `departamento?`, `provincia?`, `distrito` (obligatorio), `direccion` (obligatoria, ≤250), `referencia?`, `predeterminada?`. Máximo 10 por cliente. Una dirección usada por un pedido en curso no se puede modificar ni borrar (409).

**Pedidos**

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/api/pedidos` | C | Crea el pedido (201) |
| GET | `/api/pedidos/mios?page&size` | C | Pedidos del cliente |
| GET | `/api/pedidos?lectorId&estado&estadoPago&tipoEntrega&q&page&size` | V, A | Listado de gestión. `sort`: `fechaPedido`, `total`, `numeroPedido` |
| GET | `/api/pedidos/{id}` | C (propio), V, A | Detalle completo |
| POST | `/api/pedidos/{id}/confirmar` | V, A | Confirma un pedido que se pagará al recibir. Sin cuerpo |
| POST | `/api/pedidos/{id}/pagos/{pagoId}/confirmar` | V, A | Registra el cobro en mostrador o contraentrega. Cuerpo opcional `{ referenciaExterna? }` |
| POST | `/api/pedidos/{id}/pagos/{pagoId}/pago-simulado` | C, A | Pasarela simulada: `{ resultado: "APROBADO" \| "RECHAZADO" }` |
| POST | `/api/pedidos/{id}/pagos/reintentar` | C, A | Crea un nuevo intento tras un rechazo. Sin cuerpo |
| POST | `/api/pedidos/{id}/estado` | V, A | Avanza el pedido (ver abajo) |
| POST | `/api/pedidos/{id}/cancelar` | C, V, A | `{ motivo }` |

Crear pedido:

```json
{
  "tipoEntrega": "Delivery",
  "direccionId": 4,
  "metodoPagoCodigo": "CONTRAENTREGA",
  "lineas": [ { "libroId": 5, "cantidad": 1 }, { "libroId": 8, "cantidad": 2 } ],
  "observaciones": null
}
```

- Métodos de pago permitidos: **Recojo** → `EFECTIVO_TIENDA`, `TARJETA_TIENDA`, `PAGO_ONLINE`. **Delivery** → `CONTRAENTREGA`, `PAGO_ONLINE`. Cualquier otra combinación da 400.
- `direccionId` es obligatorio solo para `Delivery`.
- Hasta 30 líneas y 20 unidades por libro. El mismo libro repetido se suma.
- El **servidor calcula los precios y totales**; el frontend nunca envía montos. El carrito vive en el frontend: se manda completo al crear el pedido y el servidor revalida el stock (409 si algo se agotó).
- Al crear el pedido se **aparta** un ejemplar por unidad: el stock del catálogo baja de inmediato.

Totales del ejemplo del documento (35.90 + 48.50 con delivery): `subtotal` 84.40 + `costoEnvio` 8.00 = `total` 92.40.

Respuesta de un pedido (campos principales):

```json
{
  "pedidoId": 12, "numeroPedido": "PED-2026-000012",
  "lector": { "id": 3, "nombre": "Ana Cliente" },
  "tipoEntrega": "Delivery", "estado": "Pendiente", "estadoPago": "Pendiente",
  "fechaPedido": "2026-10-31T17:20:00.12",
  "subtotal": 84.4, "impuesto": 0, "costoEnvio": 8, "descuento": 0, "total": 92.4,
  "observaciones": null,
  "direccion": { "direccionId": 4, "destinatario": "...", "telefono": "...", "distrito": "...", "direccion": "...", "referencia": null, "predeterminada": true },
  "puntoRecojo": null, "plazoRecojo": null, "plazoRecojoVencido": false,
  "lineas": [ { "detallePedidoId": 20, "libro": { "id": 5, "nombre": "..." }, "cantidad": 1, "precioUnitario": 35.9, "importe": 35.9, "ejemplares": ["REC-..."] } ],
  "pagos": [ { "pagoPedidoId": 15, "metodoCodigo": "CONTRAENTREGA", "metodo": "Efectivo contraentrega", "monto": 92.4, "estado": "Pendiente", "referenciaExterna": null, "fechaRegistro": "...", "fechaConfirmacion": null, "confirmadoPor": null } ],
  "envio": { "estado": "Pendiente", "operador": null, "codigoSeguimiento": null, "fechaPreparacion": null, "fechaDespacho": null, "fechaEntrega": null, "recibidoPor": null }
}
```

`puntoRecojo` solo viene en pedidos de recojo. `plazoRecojo` y `plazoRecojoVencido` aparecen cuando el pedido está `ListoRecojo`.

Avanzar el pedido (`/estado`): `{ estado, operador?, codigoSeguimiento?, recibidoPor?, observaciones? }` con `estado` = `Preparando`, `ListoRecojo`, `Despachado` o `Entregado`.
`Entregado` exige `recibidoPor` y que el pedido esté `Pagado`. Al entregarse se crea automáticamente la venta online y los ejemplares pasan a `Vendido`.

Cancelación: el cliente puede cancelar en `Pendiente` o `Confirmado`; el personal también en `Preparando` y `ListoRecojo`. **No se puede cancelar un pedido con un pago confirmado** (409), porque el sistema no gestiona devoluciones de dinero. Al cancelar, los ejemplares vuelven a estar disponibles.

### 6.10 Ventas en mostrador (V, A)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/ventas` | Registra una venta presencial pagada (201) |
| GET | `/api/ventas?canal&estado&lectorId&desde&hasta&q&page&size` | Búsqueda. `sort`: `fechaVenta`, `total`, `numeroVenta` |
| GET | `/api/ventas/{id}` | Detalle con líneas y pagos |
| GET | `/api/ventas/pedido/{pedidoId}` | La venta generada al entregar un pedido |

Crear venta:

```json
{
  "lectorId": null,
  "codigosEjemplar": ["REC-2026-000012-D5-003"],
  "metodoPagoCodigo": "EFECTIVO_TIENDA",
  "montoRecibido": 50.00,
  "referenciaPago": null,
  "observaciones": null
}
```

- `lectorId` es opcional (cliente anónimo).
- Métodos: `EFECTIVO_TIENDA` (exige `montoRecibido`, que debe cubrir el total) o `TARJETA_TIENDA` (se registra el cobro y la `referenciaPago` opcional, no se procesa ninguna tarjeta).
- La respuesta del alta incluye `vuelto`. En consultas posteriores `vuelto` viene `null`.
- Se vende por **código de ejemplar** (se escanea). Todo es atómico: si algo falla no queda nada registrado.
- El comprobante es un **ticket interno** (`tipoComprobante: "Ticket interno"`, `numeroComprobante` = número de venta). No es una boleta ni factura electrónica.
- En las ventas online, `total` incluye el envío (la tabla no tiene columna aparte). Para ingresos solo por libros suma `lineas[].importe`.

### 6.11 Auditoría y reportes

**Auditoría** (solo A)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/auditoria?entidad&entidadId&accion&usuario&desde&hasta&q&page&size` | Eventos, del más reciente al más antiguo (`size` hasta 100) |
| GET | `/api/auditoria/{id}` | Detalle con `datosAntes`, `datosDespues` e IP |

Registra quién hizo qué en: inicios de sesión (correctos y fallidos), cambios de contraseña, creación y cambios de usuarios, cambios de precio y de estado de libros, políticas, pagos y evaluaciones de multas, anulaciones, cambios manuales de ejemplares, pagos y estados de pedidos, ventas, exportaciones y limpieza de evidencias. Nunca guarda contraseñas ni tokens. Es de solo lectura.

**Reportes** (todos `GET`; los de rango aceptan `desde` y `hasta`; sin ellos usan los últimos 30 días; máximo 366 días)

| Ruta | Quién | Contenido |
|---|---|---|
| `/api/reportes/panel` | A | Tablero de hoy: ventas del día y del mes, pedidos por atender, préstamos pendientes y vencidos, reservas activas, multas con saldo y en revisión, ejemplares disponibles |
| `/api/reportes/ventas/resumen` | V, A | Cantidad y total de ventas, unidades, total de mercadería, ticket promedio, desglose por canal, por método de pago y por día |
| `/api/reportes/ventas/top-libros?limite=10` | V, A | Libros más vendidos (unidades e importe) |
| `/api/reportes/ventas/exportar` | V, A | **CSV** de ventas del periodo (sin datos personales de clientes) |
| `/api/reportes/pedidos/resumen` | V, A | Pedidos por estado y por tipo de entrega, cancelados, pendientes de atención |
| `/api/reportes/prestamos/resumen` | A, B | Préstamos, ejemplares prestados y devueltos, devoluciones por condición, préstamos pendientes y vencidos |
| `/api/reportes/prestamos/vencidos` | A, B | Ejemplares en poder del lector pasada la fecha, con datos de contacto, ordenados por retraso |
| `/api/reportes/prestamos/top-libros?limite=10` | A, B | Libros más prestados |
| `/api/reportes/multas/resumen` | A, B | Multas generadas por tipo, cobrado por método, saldo pendiente, multas en revisión |
| `/api/reportes/inventario/resumen` | A, B | Ejemplares por estado, títulos activos, valor a costo y valor de venta disponible |
| `/api/reportes/inventario/stock-bajo?umbral=2&limite=50` | V, B, A | Libros con pocas unidades disponibles para la venta |

Notas: el resumen de ventas cuenta solo ventas `Completada`. Los números de "pendientes", "vencidos", saldo de multas e inventario son una **fotografía de hoy**, no dependen del rango. El valor a costo del inventario es un mínimo, porque las donaciones no tienen costo.

---

## 7. Flujos completos por pantalla

### 7.1 Compra online (cliente)

1. **Catálogo** (público): `GET /api/catalogo/libros` con filtros; usa `stock.disponiblesVenta` para el botón de compra.
2. **Registro / login**: `POST /api/auth/registro` y luego `POST /api/auth/login`.
3. **Direcciones** (solo si es delivery): `POST /api/pedidos/direcciones`.
4. **Checkout**: `POST /api/pedidos` con las líneas del carrito. Muestra el `total` que devuelve el servidor. Un 409 indica que algo se agotó: actualiza el carrito.
5. **Pago**:
    - **Contraentrega o pago en tienda**: no hay nada más que hacer; el cliente paga al recibir o al recoger.
    - **`PAGO_ONLINE` (simulado)**: toma `pagos[0].pagoPedidoId` de la respuesta y llama a `POST /api/pedidos/{id}/pagos/{pagoId}/pago-simulado` con `{ "resultado": "APROBADO" }`. Para demostrar el rechazo, envía `"RECHAZADO"`: el pedido queda `estadoPago: Fallido` y el cliente puede llamar a `POST /api/pedidos/{id}/pagos/reintentar` y repetir con el nuevo `pagoPedidoId`.
6. **Seguimiento**: `GET /api/pedidos/mios` y `GET /api/pedidos/{id}` (estado, pagos, `envio` con operador y código de seguimiento, `plazoRecojo`).
7. **Cancelar** (mientras esté `Pendiente` o `Confirmado` y sin pago confirmado): `POST /api/pedidos/{id}/cancelar`.

> **Pasarela simulada.** No se mueve dinero ni se reciben datos de tarjeta. Es una pantalla de prueba: el frontend debe mostrar claramente "Pago de prueba" con dos botones (Pagar / Simular rechazo) y no pedir número de tarjeta. Las referencias salen con prefijo `SIM-` (por ejemplo `SIM-9F3A21BC`). Se desactiva con `app.pagos.simulacion-habilitada: false`.

### 7.2 Atención de pedidos (vendedor o administrador)

1. Bandeja: `GET /api/pedidos?estado=Pendiente` (y los demás estados).
2. Si el pedido es contraentrega o de tienda: `POST /api/pedidos/{id}/confirmar`. Si es pago online, se confirma solo al aprobarse el pago.
3. Preparar: `POST /api/pedidos/{id}/estado` con `{ "estado": "Preparando" }`.
4. Según el tipo:
    - **Recojo**: `{ "estado": "ListoRecojo" }`. Corre el plazo de 72 horas.
    - **Delivery**: `{ "estado": "Despachado", "operador": "...", "codigoSeguimiento": "..." }`.
5. **Cobrar** (contraentrega o pago en tienda), en el momento de entregar: `POST /api/pedidos/{id}/pagos/{pagoId}/confirmar`.
6. Entregar: `{ "estado": "Entregado", "recibidoPor": "Nombre de quien recibe" }`. Se genera la venta online automáticamente.

### 7.3 Venta en mostrador

1. Escanear los códigos de los ejemplares (están en las etiquetas).
2. `POST /api/ventas` con los códigos y el método de pago. Con efectivo, enviar `montoRecibido`; la respuesta trae el `vuelto`.
3. Imprimir o mostrar el ticket con los datos de la respuesta (`numeroVenta`, líneas, total).

### 7.4 Recepción de libros (bibliotecario)

1. Si no existen: crear proveedor, ubicación y el libro en el catálogo.
2. `POST /api/inventario/recepciones` con las líneas. La respuesta trae los **códigos de los ejemplares**, que se imprimen como etiquetas.
3. Verificar en `GET /api/catalogo/libros/{id}`: el `stock` ya refleja el ingreso.

### 7.5 Préstamo y devolución

1. Buscar o registrar al lector: `GET /api/prestamos/lectores?q=` o `POST /api/prestamos/lectores`.
2. Escanear los códigos de los ejemplares: `POST /api/prestamos`. La respuesta trae `fechaVencimiento`.
3. Al devolver: `POST /api/prestamos/{id}/devoluciones` indicando la condición de cada ejemplar. Si algo vuelve dañado o perdido, subir fotos con `POST /api/prestamos/evidencias`.
4. Si hubo retraso, daño o pérdida, se crean multas (ver 6.7). Revisa `GET /api/prestamos/multas?lectorId=...&soloConSaldo=true`.
5. Para la alerta de vencidos: `GET /api/reportes/prestamos/vencidos` o `GET /api/prestamos?soloVencidos=true`.

### 7.6 Multas

1. Retraso: aparece `Pendiente`; cobrar con `POST /api/prestamos/multas/{id}/pagos` (se permiten pagos parciales).
2. Daño o pérdida: aparece `EnRevision`; evaluar con `POST .../evaluacion` fijando el monto; pasa a `Pendiente` y se cobra igual.
3. Mientras un lector tenga multas con saldo no puede pedir préstamos ni reservar (si la opción está activa).
4. El cliente consulta las suyas en `GET /api/prestamos/multas/mias`.

---

## 8. Estados y transiciones

### Ejemplar

`Disponible`, `Prestado`, `Reservado`, `ApartadoPedido`, `Vendido`, `Danado`, `Perdido`, `Reparacion`, `Baja`

| Desde | Puede pasar a |
|---|---|
| Disponible | Prestado, Reservado, ApartadoPedido, Vendido, Danado, Perdido, Reparacion, Baja |
| Prestado | Disponible, Danado, Perdido |
| Reservado | Disponible, Prestado |
| ApartadoPedido | Disponible, Vendido |
| Danado | Disponible, Reparacion, Baja |
| Perdido | Disponible, Baja |
| Reparacion | Disponible, Danado, Baja |
| Vendido, Baja | (estados finales) |

### Pedido

`Pendiente → Confirmado → Preparando → (ListoRecojo | Despachado) → Entregado`, y `Cancelado` en las condiciones de 6.9.
`ListoRecojo` es solo para Recojo y `Despachado` solo para Delivery.

`estadoPago`: `Pendiente`, `Parcial`, `Pagado`, `Fallido` (`Reembolsado` existe en la base pero no se usa).

Estado del pago individual: `Pendiente`, `Confirmado`, `Rechazado`, `Anulado`.
Estado del envío: `Pendiente`, `Preparando`, `ListoRecojo`, `EnRuta`, `Entregado`, `Cancelado`.

### Préstamo

`Activo → Parcial → Devuelto`, o `Anulado`. (`Vencido` no se guarda; usa `vencido` y `diasRetraso`.)
Estado de cada ejemplar prestado: `Prestado`, `Devuelto`, `Perdido`, `Danado`.

### Multa

`Pendiente ⇄ Parcial → Pagada`, `EnRevision → Pendiente`, y `Anulada`.

### Reserva

`Pendiente → Confirmada → Atendida`, o `Vencida` / `Cancelada`.

### Venta

`Completada`. Canales: `Presencial`, `Online`.

---

## 9. Reglas de negocio y procesos automáticos

**Reglas clave**

- Cada ejemplar físico se presta, reserva o vende **una sola vez a la vez**. Los bloqueos en base de datos impiden que dos operaciones simultáneas tomen el mismo ejemplar; la segunda recibe 409.
- Toda operación sobre ejemplares es atómica y deja un movimiento en el historial (`/movimientos`).
- Los precios se fijan en el momento: un pedido conserva el precio que tenía el libro cuando se creó.
- Un cliente no puede tener más de 3 pedidos pendientes de confirmación.
- Un lector no supera el máximo de ejemplares de la política activa (3 por defecto) en su poder.
- Los libros, lectores y usuarios **no se eliminan**: se desactivan.
- Los pagos solo los confirma el backend. El frontend nunca marca un pedido como pagado por su cuenta.

**Procesos automáticos** (corren en el servidor, el frontend no debe llamarlos)

| Proceso | Frecuencia | Qué hace |
|---|---|---|
| Reservas | Cada minuto | Vence reservas no retiradas en 48 horas y asigna ejemplares libres a la cola de espera |
| Pedidos | Cada 5 minutos | Cancela pedidos sin confirmar tras 24 horas y pedidos de recojo sin pagar tras 72 horas, liberando el stock. Si el pedido ya está pagado no se cancela solo: queda con `plazoRecojoVencido: true` para que el personal decida |
| Evidencias | Diario, 03:00 | Borra fotos de más de 365 días cuya multa ya no esté abierta |

Estos procesos actúan con el usuario interno `sistema`, que aparece en la auditoría y en los movimientos.

---

## 10. Pruebas automáticas

Hay pruebas unitarias (rápidas, sin base de datos) y de integración (levantan la aplicación completa contra una base de datos de pruebas).

**Preparación (una sola vez)**

1. Crea la base de pruebas: copia el script `BiblioNova_MySQL.sql`, cambia sus dos primeras líneas de base de datos por `CREATE DATABASE IF NOT EXISTS biblionova_test ...; USE biblionova_test;` y ejecútalo.
2. Verifica `src/test/resources/application-test.yml`: apunta a `biblionova_test`, define un `app.jwt.secret` en base64 y `app.admin.contrasena: AdminTest123!`.
3. En IntelliJ, define `DB_PASSWORD` en *Run → Edit Configurations → Edit configuration templates → JUnit → Environment variables*.

> **Nunca ejecutes las pruebas contra la base real**: crean libros, clientes, pedidos y ventas. Cuando la base de pruebas se llene, bórrala y vuelve a ejecutar el script.

**Ejecutar**: clic derecho sobre `src/test/java` → *Run 'All Tests'*, o `mvnw.cmd test` en terminal.

| Prueba | Qué comprueba |
|---|---|
| `EstadoEjemplarTest` | La matriz de transiciones de ejemplares |
| `MultaServiceTest` | Fórmulas de multa por retraso, tope, daños en revisión |
| `FlujosIntegracionTest` | Dos lectores no pueden llevarse el mismo ejemplar a la vez; una venta con efectivo insuficiente no deja nada registrado |
| `FlujosPedidosTest` | El pedido de ejemplo suma S/ 92.40; cancelar devuelve el stock; pago simulado con rechazo, reintento y aprobación |
| `FlujosPrestamosTest` | Retraso genera multa que bloquea nuevos préstamos hasta pagarla |
| `PermisosPorRolTest` | Cada rol solo accede a lo suyo |
| `ReportesTest` | Resúmenes, CSV, permisos y validación de rangos |

Las pruebas dependen de los valores por defecto (delivery S/ 8.00, impuesto 0 %, política de S/ 1.00 por día). Si los cambias, ajusta los montos esperados.

---

## 11. Decisiones y limitaciones conocidas

**Fuera del alcance del proyecto**

- **Reembolsos.** No existen. Por eso un pedido con pago confirmado no se puede cancelar, ni una multa con pagos se puede anular.
- **Pagos reales.** El pago online es simulado; el pago con tarjeta en tienda solo se registra.
- **Comprobantes electrónicos (SUNAT).** El ticket es interno y no tiene valor fiscal.
- **Notificaciones por correo o SMS.** No se envían. El cliente consulta el estado de sus pedidos y reservas desde la aplicación.
- **Recuperación de contraseña por correo.** No existe; un administrador puede restablecerla (`POST /api/seguridad/usuarios/{id}/contrasena`).
- **Refresh token y cierre de sesión en servidor.** No existen (ver 5.2).
- **Subida de portadas de libros.** No existe; se guarda una URL.

**Ventas.** Una venta completada **no se anula**: el modelo de datos exige un registro único por ejemplar vendido y no hay reembolsos. Una venta registrada por error se corrige directamente en la base de datos. Si se define una política de devoluciones comerciales, habría que cambiar esa restricción del esquema.

**Permisos a tener en cuenta al diseñar el frontend**

- El **Vendedor no puede consultar el inventario ni buscar lectores** (esos endpoints son de Administrador y Bibliotecario). Su venta en mostrador funciona escaneando los códigos de los ejemplares, con cliente anónimo o con un `lectorId` que ya conozca. Si la pantalla de ventas necesita listar ejemplares o buscar lectores, hay que habilitar esas lecturas para el rol Vendedor.
- El **Bibliotecario no ve pedidos ni ventas** y el Vendedor no ve préstamos.

**Reglas de negocio asumidas**, no aprobadas formalmente por el negocio (todas se pueden cambiar en `application.yml` o con una política nueva): retención de reservas de 48 horas, máximo 3 reservas, bloqueo de lectores con multas, delivery fijo de S/ 8.00, plazos de 24 y 72 horas para pedidos, máximo 3 pedidos pendientes, tope de multa por ejemplar, y sin descuentos.

**Retención de datos.** La auditoría no se borra nunca desde la aplicación. Las fotos de evidencia sí, según `app.evidencias.dias-retencion`.

---

## 12. Problemas frecuentes

| Síntoma | Causa probable y solución |
|---|---|
| El navegador bloquea la petición ("blocked by CORS policy") | Tu frontend corre en un origen distinto de `http://localhost:5173`. Agrégalo en `SecurityConfig.corsConfigurationSource()` y reinicia el backend |
| 401 en todo de pronto | El token expiró (120 min) o la cuenta fue desactivada. Vuelve a iniciar sesión |
| 403 en una pantalla | El rol no tiene permiso. Revisa la matriz de 5.5 |
| 401 en un endpoint público de `gestion` del catálogo (o 403) | Esos endpoints sí requieren token. Solo `GET` de libros, categorías, editoriales y autores es público |
| 409 al crear un pedido | Sin stock, tienes demasiados pedidos pendientes, o hay una operación simultánea. Lee el `mensaje` |
| 400 con fechas | Usa el formato `yyyy-MM-dd` |
| La app no arranca: "ObjectMapper" o "Jackson" | Este proyecto usa Spring Boot 4 con Jackson 3 (paquete `tools.jackson`). No uses `com.fasterxml.jackson.databind.ObjectMapper` como bean |
| La app no arranca: error de validación del esquema | El script SQL no se ejecutó completo, o se ejecutó en otra base. Revisa la URL de conexión |
| `DataInitializer` no crea el admin | `ADMIN_PASSWORD` está vacío, o ya existen usuarios en la base |
| Subir una foto da 400 | No es JPG, PNG o WEBP real (se valida el contenido, no la extensión) |
| Subir una foto da 413 | Pesa más de 5 MB. Comprímela antes de subirla |
| Un enlace directo a la foto o al CSV da 401 | Esos recursos requieren el encabezado `Authorization`. Descárgalos con `fetch` y crea una URL local con el `blob` (ver 5.6) |
| Las pruebas conectan a la base real | La clase de prueba no tiene `@ActiveProfiles("test")` |