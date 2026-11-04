package com.example.biblionova.common.almacenamiento;

import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.common.exception.SolicitudInvalidaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Component
public class AlmacenLocal implements AlmacenArchivos {

    private final Path base;

    public AlmacenLocal(@Value("${app.almacenamiento.directorio}") String directorio) throws IOException {
        this.base = Path.of(directorio).toAbsolutePath().normalize();
        Files.createDirectories(base);
    }

    @Override
    public void guardar(String clave, InputStream contenido, long tamano, String contentType) throws IOException {
        Path destino = resolver(clave);
        Files.createDirectories(destino.getParent());
        Files.copy(contenido, destino, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public Resource cargar(String clave) {
        Path ruta = resolver(clave);
        if (!Files.isRegularFile(ruta)) throw new RecursoNoEncontradoException("Archivo", clave);
        return new FileSystemResource(ruta);
    }

    @Override
    public void eliminar(String clave) {
        try { Files.deleteIfExists(resolver(clave)); }
        catch (IOException e) { throw new UncheckedIOException(e); }
    }

    private Path resolver(String clave) {
        Path p = base.resolve(clave).normalize();
        if (!p.startsWith(base)) throw new SolicitudInvalidaException("Ruta inválida");
        return p;
    }
}