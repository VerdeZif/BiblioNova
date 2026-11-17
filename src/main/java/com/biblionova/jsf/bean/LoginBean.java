
package com.biblionova.jsf.bean;

import com.biblionova.jsf.security.LdapAuthService;
import com.biblionova.jsf.security.LdapRoleService;

import jakarta.enterprise.context.SessionScoped;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.servlet.http.HttpServletRequest;

import java.io.Serializable;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

@Named("loginBean")
@SessionScoped
public class LoginBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private static final Logger LOGGER =
            Logger.getLogger(LoginBean.class.getName());

    @Inject
    private LdapAuthService ldapAuthService;

    @Inject
    private LdapRoleService ldapRoleService;

    private String usuario;
    private String password;
    private String usuarioAutenticado;
    private String mensaje;

    private Set<String> roles = new LinkedHashSet<>();

    public String iniciarSesion() {

        String claveIngresada = password;
        password = null;
        mensaje = null;

        usuarioAutenticado = null;
        roles.clear();

        if (usuario == null || usuario.isBlank()
                || claveIngresada == null
                || claveIngresada.isBlank()) {

            mensaje = "Ingresa tu usuario y contraseña.";
            return null;
        }

        try {
            String usuarioIngresado = usuario.trim();

            boolean valido = ldapAuthService.autenticar(
                    usuarioIngresado,
                    claveIngresada
            );

            if (!valido) {
                mensaje = "Usuario o contraseña incorrectos.";
                return null;
            }

            Set<String> rolesLDAP =
                    ldapRoleService.obtenerRoles(
                            usuarioIngresado,
                            claveIngresada
                    );

            if (rolesLDAP.isEmpty()) {
                mensaje = "Tu usuario no tiene un rol autorizado.";
                return null;
            }

            FacesContext contexto =
                    FacesContext.getCurrentInstance();

            HttpServletRequest request =
                    (HttpServletRequest) contexto
                            .getExternalContext()
                            .getRequest();

            request.getSession(true);
            request.changeSessionId();

            usuarioAutenticado = usuarioIngresado;
            roles = new LinkedHashSet<>(rolesLDAP);
            usuario = usuarioIngresado;
            mensaje = null;

            return "/index.xhtml?faces-redirect=true";

        } catch (Exception e) {

            usuarioAutenticado = null;
            roles.clear();

            mensaje = "No se pudo completar la autenticación LDAP.";

            LOGGER.log(
                    Level.SEVERE,
                    "Error de autenticación o consulta de roles LDAP",
                    e
            );

            return null;
        }
    }

    public String cerrarSesion() {

        FacesContext contexto =
                FacesContext.getCurrentInstance();

        contexto.getExternalContext().invalidateSession();

        return "/login.xhtml?faces-redirect=true";
    }

    public boolean isAutenticado() {
        return usuarioAutenticado != null
                && !usuarioAutenticado.isBlank()
                && !roles.isEmpty();
    }

    public boolean tieneRol(String rol) {
        return isAutenticado()
                && rol != null
                && roles.contains(rol);
    }

    public Set<String> getRoles() {
        return Set.copyOf(roles);
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsuarioAutenticado() {
        return usuarioAutenticado;
    }

    public String getMensaje() {
        return mensaje;
    }
}
