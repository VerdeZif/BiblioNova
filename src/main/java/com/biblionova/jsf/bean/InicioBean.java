package com.biblionova.jsf.bean;

import jakarta.enterprise.context.SessionScoped;
import jakarta.inject.Named;
import java.io.Serializable;

@Named("inicioBean")
@SessionScoped
public class InicioBean implements Serializable {
    private static final long serialVersionUID = 1L;
    private String nombre = "";

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public void probar() {
        // JSF actualiza el modelo y vuelve a renderizar la misma vista.
    }

    public String getSaludo() {
        return nombre == null || nombre.isBlank()
                ? "Bienvenido al módulo bibliotecario"
                : "Bienvenido, " + nombre.trim();
    }
}
