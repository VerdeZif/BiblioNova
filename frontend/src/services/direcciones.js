
import api from "./api";

export async function listarMisDirecciones() {
    const respuesta = await api.get("/pedidos/direcciones");

    if (!Array.isArray(respuesta.data)) {
        throw new Error(
            "El servidor no devolvió una lista válida de direcciones."
        );
    }

    return respuesta.data;
}

function validarDireccion(datos) {
    const campos = [
        "destinatario",
        "telefono",
        "departamento",
        "provincia",
        "distrito",
        "direccion",
    ];

    for (const campo of campos) {
        if (!String(datos?.[campo] ?? "").trim()) {
            throw new Error(`El campo ${campo} es obligatorio.`);
        }
    }

    return {
        destinatario: String(datos.destinatario).trim(),
        telefono: String(datos.telefono).trim(),
        departamento: String(datos.departamento).trim(),
        provincia: String(datos.provincia).trim(),
        distrito: String(datos.distrito).trim(),
        direccion: String(datos.direccion).trim(),
        referencia: String(datos.referencia ?? "").trim(),
        predeterminada: datos.predeterminada === true,
    };
}

function validarId(id) {
    const numero = Number(id);

    if (!Number.isInteger(numero) || numero <= 0) {
        throw new Error("El ID de la dirección no es válido.");
    }

    return numero;
}

export async function crearDireccion(datos) {
    const respuesta = await api.post(
        "/pedidos/direcciones",
        validarDireccion(datos)
    );

    return respuesta.data;
}

export async function actualizarDireccion(id, datos) {
    const respuesta = await api.put(
        `/pedidos/direcciones/${validarId(id)}`,
        validarDireccion(datos)
    );

    return respuesta.data;
}

export async function eliminarDireccion(id) {
    await api.delete(
        `/pedidos/direcciones/${validarId(id)}`
    );

    return true;
}
