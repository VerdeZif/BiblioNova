package com.example.biblionova.common.util;

import java.time.LocalDate;
import java.util.UUID;

public final class Codigos {
    private Codigos() {}

    /** Valor provisional para poder insertar y luego armar el código con el id generado. */
    public static String temporal() {
        return "TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    }

    public static String formatear(String prefijo, long id) {
        return "%s-%d-%06d".formatted(prefijo, LocalDate.now().getYear(), id);
    }

    /** MySQL compara sin distinguir mayúsculas; en Java hacemos lo mismo. */
    public static String normalizar(String codigo) {
        return codigo.trim().toLowerCase();
    }
}
