package com.biblionova.jsf.bean;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.entity.Libro;
import com.biblionova.jsf.repository.EjemplarRepository;
import com.biblionova.jsf.repository.LibroRepository;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.util.List;

@Named("ejemplarBean")
@RequestScoped
public class EjemplarBean {

    @Inject
    private EjemplarRepository ejemplarRepository;

    @Inject
    private LibroRepository libroRepository;

    private String codigo;
    private Long libroId;
    private String condicionFisica = "Bueno";
    private String mensaje;

    public void guardar() {
        try {
            if (libroId == null) {
                mensaje = "Debes seleccionar un libro.";
                return;
            }

            Libro libro = libroRepository.buscarPorId(libroId);

            if (libro == null) {
                mensaje = "El libro seleccionado no existe.";
                return;
            }

            Ejemplar ejemplar = new Ejemplar();
            ejemplar.setCodigo(codigo);
            ejemplar.setLibro(libro);
            ejemplar.setEstado("Disponible");
            ejemplar.setCondicionFisica(condicionFisica);

            ejemplarRepository.guardar(ejemplar);

            mensaje = "Ejemplar registrado correctamente.";

            codigo = null;
            libroId = null;
            condicionFisica = "Bueno";

        } catch (Exception e) {
            mensaje = "No se pudo registrar el ejemplar. Verifica que el codigo no exista.";
        }
    }

    public List<Ejemplar> getEjemplares() {
        return ejemplarRepository.listar();
    }

    public List<Libro> getLibros() {
        return libroRepository.listar();
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Long getLibroId() {
        return libroId;
    }

    public void setLibroId(Long libroId) {
        this.libroId = libroId;
    }

    public String getCondicionFisica() {
        return condicionFisica;
    }

    public void setCondicionFisica(String condicionFisica) {
        this.condicionFisica = condicionFisica;
    }

    public String getMensaje() {
        return mensaje;
    }
}
