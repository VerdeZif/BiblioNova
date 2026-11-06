import api from "./api";

const TAMANO_PAGINA = 20;

function validarId(id, entidad = "usuario") {
    const valor = Number(id);

    if (!Number.isInteger(valor) || valor <= 0) {
        throw new Error(`El identificador del ${entidad} no es válido.`);
    }

    return valor;
}

function validarCorreo(correo) {
    const valor = String(correo ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        throw new Error("Ingresa un correo electrónico válido.");
    }

    return valor;
}

function validarNombreCompleto(nombreCompleto) {
    const valor = String(nombreCompleto ?? "")
        .trim()
        .replace(/\s+/g, " ");

    if (valor.length < 3 || valor.length > 120) {
        throw new Error(
            "El nombre completo debe tener entre 3 y 120 caracteres."
        );
    }

    if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(valor)) {
        throw new Error(
            "El nombre completo solo puede contener letras y separadores habituales."
        );
    }

    return valor;
}

function validarNombreUsuario(nombreUsuario) {
    const valor = String(nombreUsuario ?? "").trim();

    if (valor.length < 3 || valor.length > 40 || /\s/.test(valor)) {
        throw new Error(
            "El nombre de usuario debe tener entre 3 y 40 caracteres y no contener espacios."
        );
    }

    return valor;
}

function validarRol(rol) {
    const valor = String(rol ?? "").trim();

    if (!valor) {
        throw new Error("Selecciona un rol válido.");
    }

    return valor;
}

function validarContrasena(contrasena, campo = "La contraseña") {
    const valor = String(contrasena ?? "");

    if (valor.length < 8 || valor.length > 100) {
        throw new Error(
            `${campo} debe tener entre 8 y 100 caracteres.`
        );
    }

    return valor;
}

function validarPaginacion(page, size) {
    const pagina = Number(page);
    const tamano = Number(size);

    if (!Number.isInteger(pagina) || pagina < 0) {
        throw new Error("La página solicitada no es válida.");
    }

    if (
        !Number.isInteger(tamano) ||
        tamano < 1 ||
        tamano > 100
    ) {
        throw new Error(
            "El tamaño de página debe estar entre 1 y 100."
        );
    }

    return {
        page: pagina,
        size: tamano,
    };
}

// Listar usuarios con búsqueda, rol, estado y paginación.
export async function listarUsuarios({
                                         q = "",
                                         rol,
                                         activo,
                                         page = 0,
                                         size = TAMANO_PAGINA,
                                         sort,
                                     } = {}) {
    const paginacion = validarPaginacion(page, size);
    const params = { ...paginacion };

    if (String(q).trim()) {
        params.q = String(q).trim();
    }

    if (rol) {
        params.rol = String(rol).trim();
    }

    if (typeof activo === "boolean") {
        params.activo = activo;
    }

    if (Array.isArray(sort) && sort.length) {
        params.sort = sort;
    } else if (typeof sort === "string" && sort.trim()) {
        params.sort = sort.trim();
    }

    const respuesta = await api.get(
        "/seguridad/usuarios",
        { params }
    );

    return respuesta.data;
}

// Obtener roles disponibles desde el backend.
export async function listarRoles() {
    const respuesta = await api.get("/seguridad/roles");

    if (!Array.isArray(respuesta.data)) {
        throw new Error(
            "La respuesta de roles del servidor no tiene el formato esperado."
        );
    }

    return respuesta.data;
}

// Registrar usuario.
export async function crearUsuario(datos) {
    const payload = {
        nombreUsuario: validarNombreUsuario(datos?.nombreUsuario),
        nombreCompleto: validarNombreCompleto(datos?.nombreCompleto),
        correo: validarCorreo(datos?.correo),
        contrasena: validarContrasena(datos?.contrasena),
        rol: validarRol(datos?.rol),
    };

    const respuesta = await api.post(
        "/seguridad/usuarios",
        payload
    );

    return respuesta.data;
}

// Actualizar usuario.
export async function actualizarUsuario(id, datos) {
    const usuarioId = validarId(id);

    const payload = {
        nombreCompleto: validarNombreCompleto(datos?.nombreCompleto),
        correo: validarCorreo(datos?.correo),
        rol: validarRol(datos?.rol),
    };

    const respuesta = await api.put(
        `/seguridad/usuarios/${usuarioId}`,
        payload
    );

    return respuesta.data;
}

// Cambiar contraseña.
export async function cambiarContrasenaUsuario(
    id,
    contrasenaNueva
) {
    const usuarioId = validarId(id);

    const payload = {
        contrasenaNueva: validarContrasena(
            contrasenaNueva,
            "La nueva contraseña"
        ),
    };

    await api.post(
        `/seguridad/usuarios/${usuarioId}/contrasena`,
        payload
    );

    return true;
}

// Activar o desactivar usuario.
export async function cambiarEstadoUsuario(id, valor) {
    const usuarioId = validarId(id);

    if (typeof valor !== "boolean") {
        throw new Error(
            "El estado del usuario debe ser activo o inactivo."
        );
    }

    const respuesta = await api.patch(
        `/seguridad/usuarios/${usuarioId}/activo`,
        null,
        {
            params: { valor },
        }
    );

    return respuesta.data;
}