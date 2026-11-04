package com.example.biblionova;

import org.junit.jupiter.api.Test;

class PermisosPorRolTest extends PruebaIntegracionBase {

    @Test
    void cadaRolSoloAccedeASuParteDelSistema() throws Exception {
        String vendedor = crearPersonal("Vendedor");
        String biblio = crearPersonal("Bibliotecario");
        Cliente cliente = crearCliente();

        consultarCon(vendedor, "/api/pedidos", 200);
        consultarCon(vendedor, "/api/prestamos", 403);
        consultarCon(vendedor, "/api/auditoria", 403);

        consultarCon(biblio, "/api/prestamos", 200);
        consultarCon(biblio, "/api/ventas", 403);
        consultarCon(biblio, "/api/seguridad/usuarios", 403);

        consultarCon(cliente.token(), "/api/pedidos/mios", 200);
        consultarCon(cliente.token(), "/api/ventas", 403);
        consultarCon(cliente.token(), "/api/prestamos", 403);

        consultarCon(tokenAdmin, "/api/auditoria", 200);
        consultarCon(null, "/api/ventas", 401);
    }
}