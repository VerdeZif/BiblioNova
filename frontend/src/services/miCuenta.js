
import api from "./api";

export async function cambiarMiContrasena(datos) {
    const contrasenaActual = String(
        datos?.contrasenaActual ?? ""
    );

    const contrasenaNueva = String(
        datos?.contrasenaNueva ?? ""
    );

    if (!contrasenaActual) {
        throw new Error("Ingresa tu contraseña actual.");
    }

    if (
        contrasenaNueva.length < 8 ||
        contrasenaNueva.length > 100
    ) {
        throw new Error(
            "La nueva contraseña debe tener entre 8 y 100 caracteres."
        );
    }

    if (contrasenaActual === contrasenaNueva) {
        throw new Error(
            "La nueva contraseña debe ser diferente de la actual."
        );
    }

    await api.post("/auth/cambiar-contrasena", {
        contrasenaActual,
        contrasenaNueva,
    });

    // El backend responde 204 No Content.
    return true;
}
