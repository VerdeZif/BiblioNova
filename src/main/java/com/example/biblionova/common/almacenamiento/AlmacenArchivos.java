package com.example.biblionova.common.almacenamiento;

import org.springframework.core.io.Resource;
import java.io.IOException;
import java.io.InputStream;

public interface AlmacenArchivos {
    void guardar(String clave, InputStream contenido, long tamano, String contentType) throws IOException;
    Resource cargar(String clave); // Lanza RecursoNoEncontradoException si no existe
    void eliminar(String clave);
}
