package com.example.biblionova.common.util;

import org.springframework.data.domain.Page;
import java.util.List;

public record PageResponse<T>(List<T> contenido, int pagina, int tamano,
                              long totalElementos, int totalPaginas) {
    public static <T> PageResponse<T> de(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages());
    }
}
