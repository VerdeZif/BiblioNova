package com.biblionova.jsf.bean;

import com.biblionova.jsf.service.ConexionService;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

@Named("conexionBean")
@RequestScoped
public class ConexionBean {

    @Inject
    private ConexionService conexionService;

    private String mensaje = "";

    public void probarConexion() {
        try {
            if (conexionService.verificarConexion()) {
                mensaje = "Conexion exitosa con MySQL mediante JPA/Hibernate.";
            } else {
                mensaje = "No se pudo verificar la conexion.";
            }
        } catch (Exception e) {
            mensaje = "Error al conectar con MySQL. Revisa el log de WildFly.";
        }
    }

    public String getMensaje() {
        return mensaje;
    }
}
