
package com.biblionova.jsf.security;

import com.biblionova.jsf.bean.LoginBean;

import jakarta.inject.Inject;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@WebFilter(urlPatterns = {"*.xhtml", "/api/*"})
public class AuthFilter implements Filter {

    private static final String CSRF_SESSION_KEY =
            "BIBLIONOVA_CSRF_TOKEN";

    private static final SecureRandom RANDOM =
            new SecureRandom();

    @Inject
    private LoginBean loginBean;

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req =
                (HttpServletRequest) request;

        HttpServletResponse res =
                (HttpServletResponse) response;

        String contexto = req.getContextPath();

        String ruta = req.getRequestURI()
                .substring(contexto.length());

        String metodo = req.getMethod();

        boolean esApi =
                ruta.equals("/api")
                        || ruta.startsWith("/api/");

        res.setHeader(
                "Cache-Control",
                "no-store, no-cache, must-revalidate"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("X-Content-Type-Options", "nosniff");

        // Página pública de inicio de sesión.
        if (ruta.equals("/login.xhtml")) {
            chain.doFilter(request, response);
            return;
        }

        // Endpoint público de estado:
        // únicamente permite GET y HEAD.
        if (ruta.equals("/api/estado")) {

            if ("GET".equalsIgnoreCase(metodo)
                    || "HEAD".equalsIgnoreCase(metodo)) {

                chain.doFilter(request, response);

            } else {
                responderJson(
                        res,
                        405,
                        "Método no permitido."
                );
            }

            return;
        }

        HttpSession sesion = req.getSession(false);

        boolean autenticado =
                sesion != null
                        && loginBean.isAutenticado();

        if (!autenticado) {

            if (esApi) {
                responderJson(
                        res,
                        401,
                        "Debes iniciar sesión."
                );
            } else {
                res.sendRedirect(
                        contexto + "/login.xhtml"
                );
            }

            return;
        }

        boolean administrador =
                loginBean.tieneRol("ADMINISTRADOR");

        boolean bibliotecario =
                loginBean.tieneRol("BIBLIOTECARIO");

        boolean estudiante =
                loginBean.tieneRol("ESTUDIANTE");

        boolean personal =
                administrador || bibliotecario;

        // =========================================
        // AUTORIZACIÓN REST
        // =========================================

        if (esApi) {

            if (ruta.equals("/api/csrf-token")) {

                if (!"GET".equalsIgnoreCase(metodo)) {
                    responderJson(
                            res,
                            405,
                            "Método no permitido."
                    );
                    return;
                }

                String token = obtenerOCrearToken(sesion);

                res.setContentType(
                        "application/json;charset=UTF-8"
                );

                res.getWriter().write(
                        "{\"csrfToken\":\"" + token + "\"}"
                );

                return;
            }

            boolean consulta =
                    "GET".equalsIgnoreCase(metodo)
                            || "HEAD".equalsIgnoreCase(metodo);

            boolean escritura =
                    "POST".equalsIgnoreCase(metodo)
                            || "PUT".equalsIgnoreCase(metodo)
                            || "PATCH".equalsIgnoreCase(metodo)
                            || "DELETE".equalsIgnoreCase(metodo);

            if (!consulta && !escritura) {
                responderJson(
                        res,
                        405,
                        "Método HTTP no permitido."
                );
                return;
            }

            boolean libros =
                    ruta.equals("/api/libros")
                            || ruta.startsWith("/api/libros/");

            boolean ejemplares =
                    ruta.equals("/api/ejemplares")
                            || ruta.startsWith("/api/ejemplares/");

            boolean prestamos =
                    ruta.equals("/api/prestamos")
                            || ruta.startsWith("/api/prestamos/");

            boolean cache =
                    ruta.equals("/api/cache")
                            || ruta.startsWith("/api/cache/");

            if (!libros && !ejemplares
                    && !prestamos && !cache) {

                responderJson(
                        res,
                        403,
                        "Recurso REST no autorizado."
                );
                return;
            }

            if (consulta) {

                boolean puedeLeer =
                        ((libros || ejemplares)
                                && (personal || estudiante))
                                || ((prestamos || cache) && personal);

                if (!puedeLeer) {
                    responderJson(
                            res,
                            403,
                            "Tu rol no permite consultar este recurso."
                    );
                    return;
                }

                chain.doFilter(request, response);
                return;
            }

            String tokenRecibido =
                    req.getHeader("X-CSRF-Token");

            String tokenEsperado =
                    (String) sesion.getAttribute(
                            CSRF_SESSION_KEY
                    );

            if (!tokenValido(
                    tokenEsperado,
                    tokenRecibido
            )) {

                responderJson(
                        res,
                        403,
                        "Token CSRF ausente o inválido."
                );

                return;
            }

            boolean puedeEscribir =
                    personal
                            && (libros || ejemplares || prestamos);

            if (!puedeEscribir) {

                responderJson(
                        res,
                        403,
                        "No tienes permisos para modificar este recurso."
                );

                return;
            }

            chain.doFilter(request, response);
            return;
        }

        // =========================================
        // AUTORIZACIÓN JSF
        // =========================================

        if (ruta.equals("/index.xhtml")
                || ruta.equals("/mis-roles.xhtml")) {

            chain.doFilter(request, response);
            return;
        }

        if (ruta.equals("/usuarios.xhtml")) {

            if (administrador) {
                chain.doFilter(request, response);
            } else {
                res.sendError(
                        403,
                        "Acceso exclusivo del administrador."
                );
            }

            return;
        }

        if (personal) {
            chain.doFilter(request, response);
            return;
        }

        res.sendError(
                403,
                "No tienes permisos para acceder a esta página."
        );
    }

    private String obtenerOCrearToken(
            HttpSession sesion
    ) {

        String existente =
                (String) sesion.getAttribute(
                        CSRF_SESSION_KEY
                );

        if (existente != null) {
            return existente;
        }

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        sesion.setAttribute(
                CSRF_SESSION_KEY,
                token
        );

        return token;
    }

    private boolean tokenValido(
            String esperado,
            String recibido
    ) {

        if (esperado == null
                || recibido == null) {
            return false;
        }

        return MessageDigest.isEqual(
                esperado.getBytes(StandardCharsets.UTF_8),
                recibido.getBytes(StandardCharsets.UTF_8)
        );
    }

    private void responderJson(
            HttpServletResponse res,
            int estado,
            String mensaje
    ) throws IOException {

        res.setStatus(estado);
        res.setContentType(
                "application/json;charset=UTF-8"
        );

        String texto = mensaje
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");

        res.getWriter().write(
                "{\"error\":\"" + texto + "\"}"
        );
    }
}
