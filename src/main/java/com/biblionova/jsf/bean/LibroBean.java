package com.biblionova.jsf.bean;

import com.biblionova.jsf.entity.Libro;
import com.biblionova.jsf.repository.LibroRepository;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.util.List;

@Named("libroBean")
@RequestScoped
public class LibroBean {

    @Inject
    private LibroRepository libroRepository;

    private Libro libro = new Libro();

    private String mensaje;

    // Registrar un libro.
    public void guardar() {
        try {
            libroRepository.guardar(libro);
            mensaje = "Libro registrado correctamente.";
            libro = new Libro();
        } catch (Exception e) {
            mensaje = "No se pudo registrar el libro. Verifica el ISBN y los datos ingresados.";
        }
    }

    // Consultar libros registrados.
    public List<Libro> getLibros() {
        return libroRepository.listar();
    }

    public Libro getLibro() {
        return libro;
    }

    public void setLibro(Libro libro) {
        this.libro = libro;
    }

    public String getMensaje() {
        return mensaje;
    }
}
