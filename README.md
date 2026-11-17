
# 📚 Sistema de Gestión Bibliotecaria
## Universidad Tecnológica XYZ

Sistema web desarrollado para administrar los recursos bibliográficos de la **Biblioteca de la Universidad Tecnológica XYZ**, permitiendo gestionar libros, ejemplares físicos, usuarios universitarios, préstamos, devoluciones y reportes.

El proyecto utiliza **Jakarta EE**, **Jakarta Server Faces (JSF)**, **JPA/Hibernate**, **MariaDB**, **LDAP** y **WildFly**, incorporando controles de seguridad, validaciones personalizadas, servicios REST y generación de reportes en PDF y Excel.

---

## 📋 Información del proyecto

| Característica | Descripción |
|---|---|
| Proyecto | Sistema de Gestión Bibliotecaria |
| Institución | Universidad Tecnológica XYZ |
| Tipo | Aplicación web empresarial |
| Arquitectura | Aplicación Jakarta EE por capas |
| Lenguaje | Java 17 |
| Interfaz | Jakarta Faces (JSF) |
| Servidor | WildFly 42.0.0.Final |
| Persistencia | JPA con Hibernate |
| Base de datos | MariaDB / MySQL |
| Autenticación | LDAP / LDAPS |
| Construcción | Maven |
| IDE | IntelliJ IDEA |

---

## 🎯 Objetivo general

Desarrollar un sistema web de gestión bibliotecaria que permita administrar de manera organizada los libros, ejemplares físicos, usuarios universitarios y operaciones de préstamo y devolución, mediante una arquitectura basada en Jakarta EE.

### Objetivos específicos

- Registrar y consultar libros del catálogo universitario.
- Administrar los ejemplares físicos asociados a cada libro.
- Registrar usuarios universitarios y validar sus datos.
- Gestionar préstamos y devoluciones.
- Controlar la disponibilidad de los ejemplares.
- Limitar los préstamos activos por estudiante.
- Implementar autenticación mediante LDAP.
- Gestionar permisos mediante roles.
- Generar estadísticas mediante consultas JPQL.
- Exportar reportes en formatos PDF y Excel.
- Publicar servicios REST para la consulta de información.
- Optimizar consultas mediante caché de segundo nivel.

---

## 🛠️ Tecnologías utilizadas

### Backend

- Java 17
- Jakarta EE
- Jakarta Server Faces (JSF)
- Jakarta Contexts and Dependency Injection (CDI)
- Jakarta Persistence API (JPA)
- Hibernate ORM
- Jakarta RESTful Web Services (JAX-RS)
- Maven

### Frontend

- XHTML
- CSS3
- JSF
- Diseño responsive
- Identidad institucional granate y dorado

### Base de datos

- MariaDB / MySQL
- JPQL
- Hibernate

### Seguridad

- LDAP / LDAPS
- Autenticación institucional
- Control de acceso por roles
- Filtros de autenticación y autorización
- Protección CSRF para operaciones de escritura

### Reportes

- Apache PDFBox: generación de documentos PDF.
- Apache POI: generación de archivos Excel.

### Infraestructura

- WildFly 42.0.0.Final
- Docker para el servidor LDAP
- IntelliJ IDEA
- Git

---

## 🏗️ Arquitectura del sistema

La aplicación utiliza una arquitectura organizada por capas para separar las responsabilidades.

```text
┌─────────────────────────────────────┐
│          INTERFAZ WEB              │
│           JSF / XHTML              │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        CAPA DE PRESENTACIÓN        │
│           Managed Beans            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          CAPA DE SERVICIOS          │
│      Reglas de negocio / CDI        │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       CAPA DE PERSISTENCIA          │
│          JPA / Hibernate            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         BASE DE DATOS              │
│          MariaDB / MySQL            │
└─────────────────────────────────────┘
```

La aplicación también integra:

- Un directorio LDAP para autenticación y roles.
- Servicios REST para la consulta de datos.
- Caché de segundo nivel para optimizar el acceso a libros.
- Servicios de exportación para PDF y Excel.

---

## 📁 Estructura del proyecto

```text
biblionova-jsf/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── biblionova/
│       │           └── jsf/
│       │               ├── bean/
│       │               ├── entity/
│       │               ├── service/
│       │               └── ...
│       │
│       ├── resources/
│       │   └── META-INF/
│       │       └── persistence.xml
│       │
│       └── webapp/
│           ├── index.xhtml
│           ├── login.xhtml
│           ├── libros.xhtml
│           ├── ejemplares.xhtml
│           ├── usuarios.xhtml
│           ├── prestamos.xhtml
│           ├── devoluciones.xhtml
│           ├── reportes.xhtml
│           ├── mis-roles.xhtml
│           │
│           └── resources/
│               └── img/
│                   └── logo-universidad-xyz.png
│
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

---

## 📖 Módulos del sistema

### 1. Inicio de sesión

Permite autenticar a los usuarios mediante el directorio LDAP institucional.

Características:

- Validación de credenciales.
- Identificación de roles.
- Control de sesiones.
- Cierre de sesión seguro.
- Restricción de acceso a páginas protegidas.

### 2. Gestión de libros

Permite registrar libros en el catálogo bibliográfico.

Información gestionada:

- ISBN
- Título
- Autor
- Editorial
- Categoría

Incluye validación personalizada de ISBN.

### 3. Gestión de ejemplares

Administra las unidades físicas asociadas a los libros.

Información gestionada:

- Libro asociado
- Código de ejemplar
- Estado de disponibilidad
- Condición física

Condiciones físicas:

- Nuevo
- Bueno
- Regular

### 4. Gestión de usuarios

Permite registrar y consultar usuarios universitarios.

Información gestionada:

- Código universitario
- Nombres
- Apellidos
- Correo electrónico
- Estado del usuario

Incluye un validador personalizado para el código universitario y validación del formato de correo.

### 5. Gestión de préstamos

Permite registrar préstamos de ejemplares disponibles.

Reglas implementadas:

- El estudiante debe estar registrado.
- El ejemplar debe estar disponible.
- Debe registrarse una fecha de vencimiento.
- Cada estudiante puede tener un máximo de **tres préstamos activos**.
- Un ejemplar prestado no puede asignarse simultáneamente a otro préstamo activo.

### 6. Gestión de devoluciones

Permite registrar la devolución de ejemplares.

Al procesar una devolución:

1. Se identifica el préstamo activo.
2. Se registra la devolución.
3. Se actualiza el estado del préstamo.
4. El ejemplar vuelve a estar disponible.
5. El historial conserva la información de la operación.

### 7. Panel de reportes

Presenta indicadores obtenidos mediante consultas JPQL:

- Total de libros registrados.
- Total de ejemplares físicos.
- Ejemplares disponibles.
- Usuarios activos.
- Préstamos activos.
- Préstamos devueltos.
- Libros más prestados.

### 8. Exportación PDF y Excel

Permite descargar reportes con las estadísticas del sistema.

Los documentos utilizan la identidad institucional de la Universidad Tecnológica XYZ:

- Logo universitario.
- Encabezados granates.
- Detalles dorados.
- Estadísticas bibliotecarias.
- Información organizada en tablas.

El PDF se genera mediante Apache PDFBox.

El Excel se genera mediante Apache POI e incluye las hojas:

- `Resumen`
- `Prestamos por libro`

### 9. Mi perfil y roles

Muestra la identidad del usuario autenticado y sus roles LDAP.

Los roles se presentan como:

- Asignado.
- No asignado.

La pantalla es informativa: no permite modificar permisos.

---

## 🔐 Autenticación y autorización LDAP

La aplicación utiliza LDAP para autenticar usuarios y determinar sus roles institucionales.

### Roles

| Rol | Permisos principales |
|---|---|
| ADMINISTRADOR | Administración de usuarios y acceso a módulos de gestión |
| BIBLIOTECARIO | Gestión bibliográfica, préstamos, devoluciones y reportes |
| ESTUDIANTE | Consulta de información bibliográfica autorizada |

### Usuarios de prueba

| Usuario | Rol |
|---|---|
| `adminbiblioteca` | Administrador |
| `bib001` | Bibliotecario |
| `est001` | Estudiante |

Las contraseñas se administran en LDAP y no se incluyen en este repositorio.

### Configuración LDAP utilizada

```properties
LDAP_URL=ldaps://ldap.universidad.test:1636
LDAP_USER_DN_PATTERN=uid={user},ou=people,dc=universidad,dc=test
```

**Nota:** estos valores corresponden al entorno local de desarrollo. Cada instalación debe configurar sus propios certificados, rutas y credenciales.

No se deben publicar contraseñas, claves privadas ni archivos de confianza que contengan información sensible.

---

## 🛡️ Seguridad

El sistema incorpora controles de seguridad para proteger las operaciones y los recursos.

### Autenticación

Los usuarios deben iniciar sesión antes de acceder a las funciones protegidas.

### Autorización

Un filtro valida los permisos necesarios para acceder a determinadas páginas y servicios.

### Gestión de sesiones

La aplicación administra sesiones autenticadas y permite cerrarlas explícitamente.

### Protección CSRF

Las operaciones de escritura protegidas requieren un token CSRF válido.

### Restricciones de acceso

La aplicación distingue los permisos del administrador, bibliotecario y estudiante.

Las restricciones deben aplicarse en el servidor y no depender únicamente de la visibilidad de los enlaces.

---

## 🌐 API REST

El proyecto expone servicios REST mediante JAX-RS.

### Endpoints de consulta

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/estado` | Consulta del estado de la aplicación |
| GET | `/api/libros` | Consulta de libros |
| GET | `/api/ejemplares` | Consulta de ejemplares |
| GET | `/api/prestamos` | Consulta de préstamos |
| GET | `/api/cache/libros/{id}` | Consulta de un libro mediante la capa de caché |
| GET | `/api/cache/estadisticas` | Estadísticas del funcionamiento de la caché |
| GET | `/api/csrf-token` | Obtención de un token CSRF |

Los endpoints están sujetos a las restricciones de autenticación y autorización correspondientes.

**Importante:** los recursos REST implementados actualmente son principalmente de consulta. No se documentan operaciones POST, PUT o DELETE como disponibles cuando no están implementadas.

### Ejemplo

```http
GET http://localhost:8080/biblionova-jsf/api/estado
```

---

## ⚡ Optimización mediante caché

Se implementó caché de segundo nivel con Hibernate e Infinispan para la entidad de libros.

Objetivos:

- Reducir accesos repetidos a la base de datos.
- Optimizar la recuperación de información.
- Consultar estadísticas relacionadas con el funcionamiento de la caché.

La aplicación dispone de endpoints específicos para realizar las comprobaciones correspondientes.

---

## 💾 Base de datos

El sistema utiliza MariaDB/MySQL y persistencia mediante JPA/Hibernate.

Base de datos configurada en el entorno de desarrollo:

```text
biblionova_senati
```

Puerto local utilizado:

```text
3307
```

### Entidades principales

**Libro**

Representa los títulos del catálogo bibliográfico.

**Ejemplar**

Representa una unidad física de un libro.

**Usuario**

Representa a los usuarios universitarios registrados en el sistema.

**Préstamo**

Registra la asignación temporal de un ejemplar a un usuario, sus fechas y su estado.

### Relaciones principales

```text
LIBRO
  │
  └── 1:N ── EJEMPLAR
                │
                └── 1:N ── PRÉSTAMO
                              │
                              └── N:1 ── USUARIO
```

Un libro puede tener varios ejemplares.

Cada ejemplar puede aparecer en distintos registros históricos de préstamo, pero no puede tener más de un préstamo activo simultáneamente.

Un usuario puede registrar varios préstamos históricos, sujeto al límite de préstamos activos.

---

## ⚙️ Requisitos de instalación

Este proyecto es una aplicación Jakarta EE / JSF desarrollada para la
Biblioteca de la Universidad Tecnológica XYZ.

### Herramientas necesarias

| Herramienta | Versión utilizada |
|---|---|
| Java JDK | 17 |
| Maven | 3.x |
| WildFly | 42.0.0.Final |
| MySQL/MariaDB | Compatible con el esquema SQL |
| Docker Desktop | Con Docker Compose |
| MySQL Connector/J | Controlador JDBC compatible |
| Git | Para clonar el proyecto |

**Puertos previstos:**

- `8080`: aplicación en WildFly.
- `3307`: base de datos.
- `1636`: servidor LDAPS.
- `9990`: administración de WildFly.

Las instalaciones nuevas deben configurar sus propios usuarios y contraseñas.

---

## 🚀 Instalación y ejecución

### 1. Descargar el proyecto

Abrir PowerShell y ejecutar:

```powershell
git clone --branch caso-practico-jsf --single-branch https://github.com/VerdeZif/BiblioNova.git
cd BiblioNova
```

La rama contiene el caso práctico JSF como proyecto Maven independiente.

### 2. Preparar la base de datos

Iniciar MySQL/MariaDB en el puerto `3307`.

Crear la base de datos desde phpMyAdmin, MySQL Workbench u otro cliente:

```sql
CREATE DATABASE IF NOT EXISTS biblionova_senati
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Después importar el archivo:

```text
database/schema.sql
```

Este archivo contiene la estructura de las tablas. No incluye cuentas LDAP
ni contraseñas de usuarios.

### 3. Preparar Docker Desktop

Comprobar que Docker esté iniciado:

```powershell
docker version
docker compose version
```

### 4. Generar certificados LDAPS

Desde la raíz del proyecto:

```powershell
.\docker\generar-certificados.ps1
```

El script genera una autoridad certificadora local y el certificado del
servidor LDAP en `docker/certs/`.

**Importante:** las claves privadas deben permanecer exclusivamente en
la computadora donde se generaron.

### 5. Crear el truststore Java

Ejecutar:

```powershell
.\docker\crear-truststore.ps1
```

Establecer una contraseña para el almacén y aceptar el certificado
cuando `keytool` lo solicite.

Se genera:

```text
docker/certs/ldap-truststore.p12
```

Conservar la contraseña: se utilizará posteriormente en WildFly.

### 6. Configurar LDAP

Crear una copia del ejemplo:

```powershell
Copy-Item ".\docker\.env.example" ".\docker\.env"
notepad ".\docker\.env"
```

Cambiar `LDAP_ADMIN_PASSWORD` por una contraseña segura y propia.

Iniciar OpenLDAP:

```powershell
docker compose -f ".\docker\compose.yml" --env-file ".\docker\.env" up -d
```

Comprobar el contenedor:

```powershell
docker ps --filter "name=universidad-ldap-practica"
```

La primera inicialización crea las unidades organizativas, los usuarios
y los grupos declarados en `docker/ldap/usuarios-grupos.ldif`.

### 7. Asignar contraseñas a los usuarios LDAP

Ejecutar:

```powershell
.\docker\configurar-usuarios.ps1
```

El script solicita las contraseñas sin guardarlas en el repositorio.

Usuarios preparados:

| Usuario | Grupo LDAP |
|---|---|
| `adminbiblioteca` | `administradores` |
| `bib001` | `bibliotecarios` |
| `est001` | `estudiantes` |

Cada instalación debe asignar sus propias contraseñas.

### 8. Instalar WildFly

Descargar y descomprimir WildFly 42.0.0.Final.

Por ejemplo:

```text
C:\wildfly-42.0.0.Final
```

La ubicación puede ser diferente en cada computadora.

Para utilizar la consola administrativa, crear una cuenta de
administración mediante `bin/add-user.bat` de WildFly.

La consola suele estar disponible en:

```text
http://localhost:9990
```

### 9. Instalar el controlador MySQL JDBC

Descargar MySQL Connector/J desde la página oficial de MySQL.

Durante el desarrollo se utilizó un controlador desplegado con el nombre:

```text
mysql-connector-j-26.10.0.jar
```

Copiar un controlador compatible a:

```text
<WILDFLY_HOME>\standalone\deployments\
```

Iniciar WildFly y verificar que el controlador JDBC se despliegue
correctamente antes de crear el datasource.

El nombre del controlador que configure WildFly debe corresponder al
nombre registrado por el servidor.

### 10. Crear el datasource BiblioNovaDS

Desde la consola administrativa de WildFly, crear y habilitar el datasource:

| Parámetro | Valor |
|---|---|
| Pool | `BiblioNovaDS` |
| JNDI | `java:jboss/datasources/BiblioNovaDS` |
| URL | `jdbc:mysql://localhost:3307/biblionova_senati` |
| Driver | MySQL Connector/J registrado |
| Usuario | Usuario autorizado de MySQL |
| Contraseña | Contraseña local de MySQL |

Comprobar la conexión desde WildFly.

El proyecto obtiene este datasource mediante:

```text
src/main/resources/META-INF/persistence.xml
```

### 11. Configurar LDAPS en WildFly

El proceso WildFly necesita las variables:

```properties
LDAP_URL=ldaps://127.0.0.1:1636
LDAP_USER_DN_PATTERN=uid={user},ou=people,dc=universidad,dc=test
```

En PowerShell se pueden definir para la sesión desde la que
se iniciará WildFly:

```powershell
$env:LDAP_URL = "ldaps://127.0.0.1:1636"
$env:LDAP_USER_DN_PATTERN = "uid={user},ou=people,dc=universidad,dc=test"
```

El proceso Java también necesita estas propiedades JVM:

```text
-Djavax.net.ssl.trustStore=RUTA_COMPLETA_DEL_TRUSTSTORE
-Djavax.net.ssl.trustStorePassword=CONTRASENA_DEL_TRUSTSTORE
-Djavax.net.ssl.trustStoreType=PKCS12
```

La ruta debe apuntar a `docker/certs/ldap-truststore.p12`.

Configurar las propiedades en el entorno local de inicio de WildFly,
sin publicar contraseñas. Evitar compartir registros o capturas que
muestren argumentos JVM con información confidencial.

El proyecto requiere conexiones `ldaps://`, no LDAP sin cifrar.

**Nota:** `127.0.0.1` es válido cuando Docker y WildFly se ejecutan en
la misma computadora. El certificado generado incluye esta IP.

### 12. Compilar el proyecto

Desde la raíz del proyecto:

```powershell
mvn clean package
```

El resultado esperado es:

```text
BUILD SUCCESS
```

Se crea:

```text
target\biblionova-jsf.war
```

### 13. Desplegar el WAR

Iniciar WildFly con el datasource y la configuración LDAPS preparados.

En PowerShell:

```powershell
$wildfly = "C:\wildfly-42.0.0.Final"

Copy-Item ".\target\biblionova-jsf.war" `
    "$wildfly\standalone\deployments\" -Force
```

Modificar `$wildfly` si se instaló en otra ubicación.

Verificar que WildFly genere:

```text
biblionova-jsf.war.deployed
```

Si aparece un marcador `.failed`, revisar los registros de WildFly
y comprobar la configuración de MySQL y LDAP.

### 14. Abrir el sistema

Inicio de sesión:

```text
http://localhost:8080/biblionova-jsf/login.xhtml
```

Página principal:

```text
http://localhost:8080/biblionova-jsf/index.xhtml
```

Utilizar las contraseñas que se asignaron a los usuarios LDAP
durante la instalación.

### 15. Comprobaciones finales

Antes de utilizar el sistema:

1. Confirmar que MySQL/MariaDB funciona y contiene las tablas.
2. Verificar el datasource `BiblioNovaDS` en WildFly.
3. Comprobar que el servidor LDAP está iniciado.
4. Confirmar que el certificado LDAPS es confiable para Java.
5. Verificar que el WAR se ha desplegado correctamente.
6. Probar el acceso con los tres perfiles LDAP.

**Seguridad:** nunca publicar `docker/.env`, archivos de claves privadas,
certificados de instalaciones reales ni contraseñas del truststore.

---

## 🧪 Pruebas realizadas

Durante el desarrollo se ejecutaron pruebas funcionales y de integración.

| Módulo | Verificación |
|---|---|
| Libros | Registro y consulta |
| Ejemplares | Registro y disponibilidad |
| Usuarios | Registro y validación |
| ISBN | Validador personalizado |
| Código universitario | Validador personalizado |
| Préstamos | Registro correcto |
| Límite de préstamos | Restricción de tres activos |
| Devoluciones | Liberación del ejemplar |
| LDAP | Inicio de sesión |
| Roles | Administrador, bibliotecario y estudiante |
| REST | Consultas y restricciones de acceso |
| CSRF | Rechazo de solicitudes sin token válido |
| Caché Hibernate | Consultas y estadísticas |
| JPQL | Indicadores y libros más prestados |
| PDF | Generación y descarga |
| Excel | Generación y descarga |

Las pruebas de PDF y Excel fueron verificadas visual y funcionalmente en el entorno de desarrollo.

---

## 🖥️ Interfaz de usuario

El sistema presenta una interfaz institucional responsive.

### Identidad visual

| Elemento | Color |
|---|---|
| Granate principal | `#69091F` |
| Granate oscuro | `#490917` |
| Dorado institucional | `#C99B29` |
| Marfil | `#F8F5F1` |
| Blanco | `#FFFFFF` |

### Pantallas principales

- Inicio de sesión.
- Panel principal.
- Gestión de libros.
- Gestión de ejemplares.
- Gestión de usuarios.
- Gestión de préstamos.
- Gestión de devoluciones.
- Panel de reportes.
- Mi perfil y roles LDAP.

La interfaz está adaptada para computadoras, tablets y teléfonos móviles.

---

## 📸 Evidencias del sistema

Se recomienda incorporar capturas de pantalla en una carpeta como:

```text
docs/
└── capturas/
    ├── login.png
    ├── inicio.png
    ├── libros.png
    ├── ejemplares.png
    ├── usuarios.png
    ├── prestamos.png
    ├── devoluciones.png
    ├── reportes.png
    ├── roles.png
    ├── reporte-pdf.png
    └── reporte-excel.png
```

Las imágenes deben corresponder a capturas reales del sistema.

---

## 📌 Alcance y limitaciones

La versión desarrollada contempla las operaciones principales de gestión bibliotecaria, autenticación LDAP, reportes y consultas REST.

### Funcionalidades implementadas

- Catálogo de libros.
- Inventario de ejemplares.
- Registro de usuarios.
- Préstamos y devoluciones.
- Validaciones personalizadas.
- Autenticación y roles LDAP.
- Reportes estadísticos.
- Exportación a PDF y Excel.
- Servicios REST de consulta.
- Caché de segundo nivel.

### Posibles ampliaciones

- Notificaciones automáticas de vencimientos.
- Reportes específicos de morosidad.
- Búsqueda avanzada del catálogo.
- Paginación de tablas.
- Auditoría detallada de operaciones.
- Ampliación de servicios REST para escritura.

Estas ampliaciones no deben considerarse implementadas sin sus respectivas verificaciones.

---

## ✅ Conclusiones

El Sistema de Gestión Bibliotecaria de la Universidad Tecnológica XYZ permite centralizar la administración de libros, ejemplares, usuarios y operaciones bibliotecarias.

La utilización de Jakarta EE, JSF, JPA e Hibernate facilita una organización por capas y el acceso estructurado a los datos.

La integración LDAP permite diferenciar los permisos de administradores, bibliotecarios y estudiantes.

Asimismo, la generación de reportes mediante JPQL, PDF y Excel proporciona herramientas para consultar y presentar las estadísticas del sistema.

El proyecto constituye una base funcional para la gestión bibliotecaria universitaria y permite incorporar nuevas características en futuras versiones.

---

## 👨‍💻 Desarrollo académico

Proyecto desarrollado como parte de la formación en **Desarrollo de Software — SENATI**.

**Sistema:** Biblioteca de la Universidad Tecnológica XYZ.

**Tecnologías principales:** Java 17, Jakarta EE, JSF, Hibernate, MariaDB, LDAP, WildFly, PDFBox y Apache POI.

---

## 📄 Licencia

Proyecto desarrollado con fines académicos.

Las condiciones de distribución y reutilización deben definirse antes de su publicación.
