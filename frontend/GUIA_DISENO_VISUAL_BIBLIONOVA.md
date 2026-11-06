# BiblioNova — Guía para mejorar el diseño visual del frontend

**Destinatario:** integrante del equipo encargado de interfaz, experiencia de usuario y estilo visual.

**Objetivo:** mejorar la estética, coherencia, usabilidad y adaptación a móviles de BiblioNova **sin romper funciones, datos reales, seguridad por roles ni integración con Spring Boot**.

> Esta guía es un punto de partida de diseño, no un rediseño implementado. Los estilos propuestos deben validarse con el equipo y probarse contra el funcionamiento real del proyecto.

## 1. Qué vas a encontrar

BiblioNova es una aplicación React + Vite con Tailwind CSS, React Router, `lucide-react` y Axios. El backend Java/Spring Boot expone la API de catálogo, préstamos, pedidos, inventario y ventas. Existen cuatro experiencias:

| Rol | Experiencia / pantallas |
| --- | --- |
| Público / Cliente | Inicio, catálogo, detalle de libro, carrito, checkout, pedidos, préstamos, reservas, mi cuenta |
| Administrador | Dashboard, libros, pedidos, ventas, inventario, usuarios y lectores |
| Bibliotecario | Dashboard, préstamos, devoluciones y reservas |
| Vendedor | Dashboard, ventas, pedidos y registro de venta presencial |

**No modificar el comportamiento de negocio** como parte de esta tarea. Todo lo que se muestre debe seguir proveniendo de las APIs o del estado existente del componente.

## 2. Identidad visual actual: punto de partida

| Token sugerido | Valor actual/referencia | Uso recomendado |
| --- | --- | --- |
| Color principal | `#3D7669` | Botones, selección, acentos, iconos |
| Hover principal | `#315e55` | Estados hover de acciones primarias |
| Fondo general | `#F8F6F1` | Fondo de páginas y dashboards |
| Tarjetas | `#FFFFFF` | Superficies, modales, formularios |
| Texto principal | Tailwind `slate-800` | Títulos y contenido |
| Texto secundario | Tailwind `slate-500` / `slate-600` | Descripciones |
| Borde | Tailwind `stone-200` | Campos, tarjetas, separadores |
| Error | Tonos `red-*` | Errores y acciones destructivas |
| Advertencia | Tonos `amber-*` | Avisos y confirmaciones |
| Éxito | Tonos `emerald-*` | Operaciones completadas |

El equipo puede proponer una evolución de la paleta, pero debe mantener contraste suficiente y consistencia entre los cuatro roles. **No usar solamente color** para comunicar el estado de un pago, préstamo o pedido; añadir texto claro e icono cuando ayude.

### Dirección visual sugerida

**BiblioNova: biblioteca contemporánea, clara y accesible.** Una identidad sobria con tonos verdes suaves, fondos cálidos, portadas de libros como protagonistas y paneles administrativos ordenados. Priorizar lectura legible y claridad operativa por encima de efectos decorativos.

## 3. Dónde trabajar

```text
frontend/src/
├── components/
│   ├── auth/AuthLayout.jsx
│   ├── layout/Navbar.jsx
│   ├── layout/AdminLayout.jsx
│   ├── layout/BibliotecarioLayout.jsx
│   ├── layout/VendedorLayout.jsx
│   └── ...
├── pages/
│   ├── public/
│   ├── auth/
│   ├── admin/
│   ├── bibliotecario/
│   └── vendedor/
├── context/                 # No cambiar lógica de autenticación o carrito
├── services/                # Evitar editar para un rediseño
└── ...
```

Antes de crear nuevos componentes, revisar si ya existe un componente equivalente. Evitar duplicar navbar, botones, tarjetas o diálogos con diferentes estilos por cada rol.

### Archivos que NO debes modificar por estética salvo acuerdo explícito

- `src/services/api.js`, `catalogoApi.js`, servicios de ventas, pedidos, inventario, préstamos y reservas.
- `src/context/AuthContext.jsx`, `CartContext` y estado de negocio.
- `src/components/ProtectedRoute.jsx`, `src/utils/roles.js` y reglas de autorización.
- Archivos Java, DTO, endpoints REST, configuración JWT y reglas del backend.
- Nombres de variables que contienen datos (`pedidoId`, `pagoPedidoId`, `estadoPago`, `lineas`, etc.).

Puedes reorganizar la presentación de componentes si conservas sus props, callbacks, condiciones de visibilidad, enlaces y mensajes de error.

## 4. Prioridades de rediseño

### Prioridad 1 — Consistencia transversal

1. Unificar estilo de botones **primario / secundario / peligro / deshabilitado**.
2. Unificar inputs, selects, textareas, etiquetas, ayudas y estados de error.
3. Unificar tarjetas, tablas, badges de estado, modales y espaciados.
4. Crear una escala tipográfica coherente y mantener títulos claros.
5. Mejorar el menú lateral y su comportamiento en móvil; indicar ruta activa.
6. Añadir estados de carga, vacío y error **sin esconder los mensajes reales**.

### Prioridad 2 — Cliente y catálogo

- Mejorar hero y disposición de portada/título/autor/precio/stock en catálogo.
- Tarjetas de libro de altura consistente, imagen proporcionada y texto legible.
- Filtros y búsqueda adaptados al móvil, con controles visibles.
- En detalle de libro: separar compra de reserva y mostrar condiciones de stock.
- Checkout en pasos visuales claros: dirección, tipo de entrega, pago y resumen. **No inventar importes ni confirmar pagos desde el diseño**.
- `Mi cuenta`, `Mis pedidos`, `Mis préstamos`: estados distinguibles, navegación clara y buen comportamiento con listas vacías.

### Prioridad 3 — Paneles operativos

- Dashboard administrador: indicadores en tarjetas, sin gráficos engañosos ni contadores inventados.
- Pedidos/ventas: tablas con encabezados legibles, acciones localizables y responsive (scroll horizontal accesible o tarjetas en móvil).
- Bibliotecario: destacar préstamos activos, vencimientos y acciones permitidas sin alterar las reglas.
- Vendedor: facilitar búsqueda/selección de ejemplares, confirmación de pagos y cambio de estado. Diferenciar claramente **confirmar cobro** de **entregar**.
- Inventario: filtros, estados de ejemplar, ubicación, proveedor y recepción ordenados; acciones irreversibles con confirmación explícita.

## 5. Sistema de componentes sugerido

Al crear componentes compartidos, comenzar de forma incremental. Nombres orientativos (no obligatorios):

| Componente | Requisitos |
| --- | --- |
| `PageHeader` | Título, descripción y acción opcional; responsive |
| `StatCard` | Métrica y estado de carga/error; no transformar cifras |
| `StatusBadge` | Texto del estado exacto y estilo semántico; configurable por dominio |
| `PrimaryButton` | Estados loading, disabled, foco visible |
| `FormField` | Label, error, `aria-describedby`, required cuando aplique |
| `EmptyState` | Mensaje específico y acción útil si corresponde |
| `ConfirmDialog` | Confirmación de cancelación/entrega; foco y accesibilidad |
| `ResponsiveTable` | Encabezados, datos, scroll y estados vacíos |

**Regla:** al extraer un componente, conservar `onClick`, `onSubmit`, `disabled`, `value`, `onChange`, rutas, nombre de campo y llamadas al servicio. No reemplazar operaciones reales por datos de ejemplo para lograr una captura bonita.

### Convenciones CSS/Tailwind

- Mantener la configuración actual del proyecto; revisar primero la versión de Tailwind y el CSS global.
- Preferir utilidades consistentes (`rounded-xl`, `border-stone-200`, `p-4`/`p-6`, `gap-3`/`gap-4`) y extraer componentes para evitar copiar cadenas largas repetidas.
- Definir tokens en el lugar apropiado de la versión instalada (CSS/theme o configuración Tailwind), sin mezclar sistemas de tokens incompatibles.
- No modificar masivamente el proyecto con búsqueda y reemplazo de colores sin revisar contraste y significado.
- No añadir bibliotecas de componentes o animación sin aprobación del equipo; minimizar el peso del bundle.

## 6. Diseño adaptable (responsive)

Trabajar al menos con estos casos de uso, no solo con ancho fijo:

- **Móvil estrecho (~360–390 px):** menú accesible, campos al 100 %, sin botones fuera de pantalla.
- **Tablet (~768 px):** tarjetas reorganizadas y filtros utilizables.
- **Escritorio (~1280 px o más):** espacio bien distribuido y columnas de lectura razonables.

Criterios concretos:

- Ningún contenido esencial debe quedar oculto por un sidebar o modal.
- Modales con `max-h` y scroll interno, botón Cerrar accesible.
- Tablas anchas con alternativa de scroll y acción visible para cada registro.
- Zonas táctiles cómodas, sin depender exclusivamente del efecto hover.
- Portadas con relación de aspecto consistente; usar `object-cover` o `object-contain` según el contenido.
- Controlar textos largos de títulos, usuarios, referencias y mensajes de error.

## 7. Accesibilidad: requisito, no decoración

- Etiquetas (`label`) vinculadas a inputs; iconos solos con `aria-label`.
- Navegación y botones utilizables con teclado; foco visible.
- Texto con contraste legible; validar especialmente el verde en fondos claros.
- No usar `div` clicable en lugar de `button` o `Link` sin necesidad.
- Mensajes de error con `role="alert"` o equivalente cuando corresponda.
- Para diálogos: comportamiento coherente de foco, Escape, cierre y fondo, sin pérdida de formularios por clic accidental.
- Respetar preferencias de movimiento reducido en animaciones.
- No interpretar rojo/verde como único indicador de estado: acompañar con etiqueta.

## 8. Estados de negocio que NO se pueden cambiar

### Pedidos

- **Recojo:** `Pendiente → Confirmado → Preparando → ListoRecojo → Entregado`.
- **Delivery:** `Pendiente → Confirmado → Preparando → Despachado → Entregado`.
- `Entregado` requiere `estadoPago = Pagado` y campo `recibidoPor`.
- Confirmar pedido, confirmar pago, cancelar y cambiar estado pueden usar **endpoints distintos**; no mezclar acciones por simplificar la UI.
- El botón cancelar solo debe aparecer cuando el backend permite la operación; conservar validación del servidor.

### Ventas

- Registro presencial desde `/vendedor/nueva-venta`.
- Historial y detalle de ventas por `/api/ventas` y `/api/ventas/{id}`.
- No mostrar un cobro ficticio o permitir registrar sin los datos requeridos.

### Roles

- Cliente: **Mis pedidos** y **Mis préstamos** (propios).
- Vendedor: **Gestionar pedidos** y **Consultar ventas**.
- Bibliotecario: **Gestionar préstamos** y **Gestionar reservas**.
- Administrador: pantallas administrativas, ventas y acceso a operaciones bibliotecarias.

La UI puede ocultar acciones no autorizadas, pero **no se modifican ni eliminan** las protecciones de React Router y Spring Security.

## 9. Cómo trabajar sin romper la aplicación

1. Sincronizar el repositorio y crear una rama propia: `feature/mejora-diseno`.
2. Comprobar que el proyecto funciona antes de editar (`npm install` o `npm ci`, `npm run dev`, `npm run build`).
3. Elegir una sola página o un componente compartido para el primer cambio.
4. Trabajar con **datos reales del entorno de desarrollo**; usar registros ficticios solo para un mockup externo, nunca como sustitución de la API.
5. Revisar en móvil, tablet y escritorio.
6. Verificar navegación, formularios, tablas, filtros, validación y permisos tras cada modificación.
7. Ejecutar `npm run build` desde `frontend`.
8. Preparar capturas **antes / después** y describir los cambios en el pull request.
9. Solicitar revisión del responsable de la lógica antes de fusionar.

### Comandos en IntelliJ IDEA (PowerShell)

Desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

Desde otra terminal en la misma carpeta:

```powershell
npm run build
```

Para encontrar dependencias y no borrar archivos todavía utilizados:

```powershell
Get-ChildItem -Path .\src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
  Select-String -Pattern 'pedidosDemo|prestamosDemo|usuariosDemo|librosAdminDemo'
```

No utilizar scripts que borren todos los archivos con `Demo` a ciegas. Si algo falla, revisar el primer error de la consola y restaurar el archivo desde Git o IntelliJ Local History.

## 10. Lista de comprobación para cada pantalla modificada

- [ ] Se mantiene exactamente la misma ruta y restricción por rol.
- [ ] Funciona con datos reales; no se añadieron mocks.
- [ ] Todos los botones y enlaces ejecutan su acción correcta.
- [ ] Los formularios siguen enviando la misma estructura de datos.
- [ ] Los errores `401`, `403`, validación y conexión siguen visibles.
- [ ] Estados de carga y listas vacías legibles.
- [ ] Presentación revisada en móvil, tablet y escritorio.
- [ ] Foco de teclado, etiquetas e iconos accesibles.
- [ ] Se conserva el stock, dinero, estados y paginación devueltos por el servidor.
- [ ] `npm run build` finaliza correctamente.
- [ ] Se adjuntan capturas antes/después y una explicación breve.

## 11. Criterios de aceptación del trabajo visual

El rediseño se considera listo cuando:

1. La experiencia es consistente entre el sitio público y los tres paneles operativos.
2. Ninguna funcionalidad, ruta, validación, mensaje de error o permiso se pierde.
3. Se preserva la identidad de BiblioNova o se documenta claramente una nueva propuesta aprobada.
4. Las pantallas principales son accesibles y utilizables en dispositivos pequeños.
5. La aplicación compila sin errores y se prueban los flujos más importantes por rol.
6. Los cambios están documentados, revisados y son fáciles de revertir.

### Entregables sugeridos del responsable de diseño

- Un mini sistema de diseño: paleta, tipografías, espaciado, componentes y estados.
- Capturas o prototipos antes/después del inicio, catálogo y cada dashboard.
- Código en una rama separada con cambios pequeños y claros.
- Registro de pantallas intervenidas, decisiones visuales y problemas detectados.
- Resultado de compilación y checklist de pruebas manuales.

## 12. Orden de trabajo recomendado

**Fase A:** definir tokens, botones, inputs, badges y tarjetas compartidos.  
**Fase B:** mejorar Navbar, layouts y sidebar de los cuatro contextos.  
**Fase C:** modernizar Home, catálogo, detalle de libro, carrito y checkout.  
**Fase D:** unificar tablas, filtros, formularios y modales de Admin, Bibliotecario y Vendedor.  
**Fase E:** pruebas de regresión, responsive, accesibilidad y revisión conjunta.

La prioridad siempre es: **legibilidad y seguridad funcional → navegación → coherencia visual → detalles estéticos**.
