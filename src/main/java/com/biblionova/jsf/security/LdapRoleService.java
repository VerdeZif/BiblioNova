
package com.biblionova.jsf.security;

import jakarta.enterprise.context.ApplicationScoped;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.ldap.LdapName;

import java.util.Hashtable;
import java.util.LinkedHashSet;
import java.util.Set;

@ApplicationScoped
public class LdapRoleService {

    private static final String GRUPOS =
            "ou=groups,dc=universidad,dc=test";

    public Set<String> obtenerRoles(
            String usuario,
            String password
    ) throws NamingException {

        if (usuario == null ||
                !usuario.matches("[A-Za-z0-9._-]{1,64}") ||
                password == null ||
                password.isBlank()) {

            throw new IllegalArgumentException(
                    "Credenciales inválidas."
            );
        }

        String url = System.getenv("LDAP_URL");

        String patron = System.getenv(
                "LDAP_USER_DN_PATTERN"
        );

        if (url == null ||
                !url.startsWith("ldaps://") ||
                patron == null ||
                !patron.contains("{user}")) {

            throw new IllegalStateException(
                    "Configuración LDAP no disponible."
            );
        }

        String dnUsuario = patron.replace(
                "{user}", usuario
        );

        Hashtable<String, Object> entorno =
                new Hashtable<>();

        entorno.put(
                Context.INITIAL_CONTEXT_FACTORY,
                "com.sun.jndi.ldap.LdapCtxFactory"
        );

        entorno.put(Context.PROVIDER_URL, url);

        entorno.put(
                Context.SECURITY_AUTHENTICATION,
                "simple"
        );

        entorno.put(
                Context.SECURITY_PRINCIPAL,
                dnUsuario
        );

        entorno.put(
                Context.SECURITY_CREDENTIALS,
                password
        );

        DirContext contexto =
                new InitialDirContext(entorno);

        try {
            Set<String> roles = new LinkedHashSet<>();

            if (pertenece(
                    contexto,
                    dnUsuario,
                    "administradores")) {

                roles.add("ADMINISTRADOR");
            }

            if (pertenece(
                    contexto,
                    dnUsuario,
                    "bibliotecarios")) {

                roles.add("BIBLIOTECARIO");
            }

            if (pertenece(
                    contexto,
                    dnUsuario,
                    "estudiantes")) {

                roles.add("ESTUDIANTE");
            }

            return roles;

        } finally {
            contexto.close();
        }
    }

    private boolean pertenece(
            DirContext contexto,
            String dnUsuario,
            String grupo
    ) throws NamingException {

        String dnGrupo = "cn=" + grupo + "," + GRUPOS;

        Attributes atributos = contexto.getAttributes(
                dnGrupo,
                new String[]{"member"}
        );

        Attribute miembros = atributos.get("member");

        if (miembros == null) {
            return false;
        }

        LdapName usuarioLDAP = new LdapName(dnUsuario);

        NamingEnumeration<?> valores = miembros.getAll();

        try {
            while (valores.hasMore()) {

                String miembro = valores.next().toString();

                if (usuarioLDAP.equals(
                        new LdapName(miembro))) {

                    return true;
                }
            }
        } finally {
            valores.close();
        }

        return false;
    }
}
