package com.example.biblionova.inventario.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EstadoEjemplarTest {

    @Test
    void disponiblePuedeIrAPrestadoReservadoApartadoOVendido() {
        assertThat(EstadoEjemplar.Disponible.destinosPermitidos()).contains(
                EstadoEjemplar.Prestado, EstadoEjemplar.Reservado,
                EstadoEjemplar.ApartadoPedido, EstadoEjemplar.Vendido);
    }

    @Test
    void vendidoYBajaSonEstadosFinales() {
        assertThat(EstadoEjemplar.Vendido.destinosPermitidos()).isEmpty();
        assertThat(EstadoEjemplar.Baja.destinosPermitidos()).isEmpty();
    }

    @Test
    void prestadoNoPuedeSaltarAVendidoNiAReservado() {
        assertThat(EstadoEjemplar.Prestado.destinosPermitidos())
                .doesNotContain(EstadoEjemplar.Vendido, EstadoEjemplar.Reservado);
    }

    @Test
    void reservadoPasaAPrestadoCuandoElLectorRetiraElLibro() {
        assertThat(EstadoEjemplar.Reservado.destinosPermitidos()).contains(EstadoEjemplar.Prestado);
    }

    @Test
    void apartadoPorPedidoSoloPuedeLiberarseOVenderse() {
        assertThat(EstadoEjemplar.ApartadoPedido.destinosPermitidos())
                .containsExactlyInAnyOrder(EstadoEjemplar.Disponible, EstadoEjemplar.Vendido);
    }
}