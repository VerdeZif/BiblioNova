
package com.biblionova.jsf.security;

import jakarta.enterprise.context.ApplicationScoped;

import javax.naming.Context;
import javax.naming.AuthenticationException;
import javax.naming.NamingException;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;

import java.util.Hashtable;

@ApplicationScoped
public class LdapAuthService {

    public boolean autenticar(String usuario, String password) {

        if (usuario == null || usuario.isBlank()
                || password == null || password.isBlank()) {
            return false;
        }

        // Evitar caracteres que no correspondan
        // a un identificador universitario.
        if (!usuario.matches("[a-zA-Z0-9._-]{3,50}")) {
            return false;
        }

        // Configuración externa del servidor LDAP.
        String url = System.getenv("LDAP_URL");
        String patronDn = System.getenv("LDAP_USER_DN_PATTERN");

        if (url == null || !url.startsWith("ldaps://")
                || patronDn == null
                || !patronDn.contains("{user}")) {

            throw new IllegalStateException(
                    "La configuración LDAP no está disponible."
            );
        }

        // Ejemplo:
        // uid={user},ou=people,dc=universidad,dc=xyz
        String dn = patronDn.replace("{user}", usuario);

        Hashtable<String, Object> entorno = new Hashtable<>();

        entorno.put(
                Context.INITIAL_CONTEXT_FACTORY,
                "com.sun.jndi.ldap.LdapCtxFactory"
        );

        entorno.put(Context.PROVIDER_URL, url);

        entorno.put(
                Context.SECURITY_AUTHENTICATION,
                "simple"
        );

        entorno.put(Context.SECURITY_PRINCIPAL, dn);
        entorno.put(Context.SECURITY_CREDENTIALS, password);

        entorno.put("com.sun.jndi.ldap.connect.timeout", "5000");
        entorno.put("com.sun.jndi.ldap.read.timeout", "5000");

        DirContext contexto = null;

        try {
            contexto = new InitialDirContext(entorno);
            return true;

        } catch (AuthenticationException e) {
            return false;

        } catch (NamingException e) {
            throw new IllegalStateException(
                    "No se pudo conectar con el servidor LDAP.",
                    e
            );

        } finally {
            if (contexto != null) {
                try {
                    contexto.close();
                } catch (NamingException ignored) {
                    // Liberar recursos.
                }
            }

            entorno.clear();
        }
    }
}
