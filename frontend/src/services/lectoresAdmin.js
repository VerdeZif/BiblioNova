import api from "./api";

const TAMANO_PAGINA = 20;

function validarId(id) {
    const valor = Number(id);

    if (!Number.isInteger(valor) || valor <= 0) {
        throw new Error(
            "El identificador del lector no es válido."
        );
    }

    return valor;
}

function validarTexto(
    valor,
    campo,
    minimo = 2,
    maximo = 100
) {
    const texto = String(valor ?? "")
        .trim()
        .replace(/\s+/g, " ");

    if (texto.length < minimo || texto.length > maximo) {
        throw new Error(
            `${campo} debe tener entre ${minimo} y ${maximo} caracteres.`
        );
    }

    return texto;
}

function validarNombre(valor, campo) {
    const texto = validarTexto(valor, campo, 2, 80);

    if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(texto)) {
        throw new Error(
            `${campo} solo debe contener letras y separadores habituales.`
        );
    }

    return texto;
}

function validarDocumento(documento) {
    const valor = String(documento ?? "").trim();

    if (!/^\d{8}$/.test(valor)) {
        throw new Error(
            "El documento debe contener exactamente 8 dígitos."
        );
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

function validarTelefono(telefono) {
    const valor = String(telefono ?? "").trim();

    if (!/^\d{9}$/.test(valor)) {
        throw new Error(
            "El teléfono debe contener exactamente 9 dígitos."
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

// Listar lectores con búsqueda y paginación.
export async function listarLectores({
                                         q = "",
                                         page = 0,
                                         size = TAMANO_PAGINA,
                                         sort,
                                     } = {}) {
    const params = validarPaginacion(page, size);

    if (String(q).trim()) {
        params.q = String(q).trim();
    }

    if (Array.isArray(sort) && sort.length) {
        params.sort = sort;
    } else if (typeof sort === "string" && sort.trim()) {
        params.sort = sort.trim();
    }

    const respuesta = await api.get(
        "/prestamos/lectores",
        { params }
    );

    return respuesta.data;
}

// Consultar un lector por ID.
export async function obtenerLectorPorId(id) {
    const lectorId = validarId(id);

    const respuesta = await api.get(
        `/prestamos/lectores/${lectorId}`
    );

    return respuesta.data;
}

// Construir y validar el cuerpo de la solicitud.
function construirPayload(datos) {
    return {
        documento: validarDocumento(datos?.documento),
        nombres: validarNombre(datos?.nombres, "Los nombres"),
        apellidos: validarNombre(datos?.apellidos, "Los apellidos"),
        correo: validarCorreo(datos?.correo),
        telefono: validarTelefono(datos?.telefono),
        direccion: validarTexto(
            datos?.direccion,
            "La dirección",
            5,
            250
        ),
    };
}

// Registrar lector.
export async function crearLector(datos) {
    const payload = construirPayload(datos);

    const respuesta = await api.post(
        "/prestamos/lectores",
        payload
    );

    return respuesta.data;
}

// Actualizar lector.
export async function actualizarLector(id, datos) {
    const lectorId = validarId(id);
    const payload = construirPayload(datos);

    const respuesta = await api.put(
        `/prestamos/lectores/${lectorId}`,
        payload
    );

    return respuesta.data;
}

// Activar o desactivar lector.
export async function cambiarEstadoLector(id, valor) {
    const lectorId = validarId(id);

    if (typeof valor !== "boolean") {
        throw new Error(
            "El estado del lector debe ser activo o inactivo."
        );
    }

    const respuesta = await api.patch(
        `/prestamos/lectores/${lectorId}/activo`,
        null,
        {
            params: { valor },
        }
    );

    return respuesta.data;
}

// Obtener el perfil de lector del usuario autenticado actual.
export async function obtenerMiLector() {
    const respuesta = await api.get("/prestamos/lectores/yo");
    return respuesta.data;
}