package com.example.biblionova.prestamos.service;

import com.example.biblionova.prestamos.entity.*;
import com.example.biblionova.prestamos.repository.MultaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MultaServiceTest {

    // El préstamo vencía el 1 de octubre
    private static final LocalDateTime CUATRO_DIAS_DESPUES = LocalDateTime.of(2026, 10, 5, 10, 0);
    private static final LocalDateTime A_TIEMPO = LocalDateTime.of(2026, 10, 1, 10, 0);

    @Mock MultaRepository multaRepo;
    @InjectMocks MultaService service;

    private Prestamo prestamo(String tarifa, String tope) {
        PoliticaPrestamo pol = new PoliticaPrestamo();
        pol.setTarifaRetrasoDiaria(new BigDecimal(tarifa));
        pol.setMaxMultaRetraso(tope == null ? null : new BigDecimal(tope));
        Prestamo p = new Prestamo();
        p.setCodigoPrestamo("PRE-2026-000001");
        p.setPolitica(pol);
        p.setFechaVencimiento(LocalDate.of(2026, 10, 1));
        return p;
    }

    private List<Multa> multasGeneradas(int veces) {
        ArgumentCaptor<Multa> captor = ArgumentCaptor.forClass(Multa.class);
        verify(multaRepo, times(veces)).save(captor.capture());
        return captor.getAllValues();
    }

    @Test
    void cuatroDiasDeRetrasoConTarifaDeUnSolGeneranCuatroSoles() {
        service.generarPorDevolucion(prestamo("1.00", null), new DetallePrestamo(),
                CUATRO_DIAS_DESPUES, CondicionRecibida.Bueno, null);

        Multa m = multasGeneradas(1).get(0);
        assertThat(m.getTipoMulta()).isEqualTo(TipoMulta.Retraso);
        assertThat(m.getDiasRetraso()).isEqualTo(4);
        assertThat(m.getMonto()).isEqualByComparingTo("4.00");
        assertThat(m.getEstado()).isEqualTo(EstadoMulta.Pendiente);
    }

    @Test
    void laMultaPorRetrasoRespetaElTopeDeLaPolitica() {
        service.generarPorDevolucion(prestamo("2.00", "5.00"), new DetallePrestamo(),
                CUATRO_DIAS_DESPUES, CondicionRecibida.Bueno, null);

        assertThat(multasGeneradas(1).get(0).getMonto()).isEqualByComparingTo("5.00");
    }

    @Test
    void devolverAtiempoYEnBuenEstadoNoGeneraMulta() {
        service.generarPorDevolucion(prestamo("1.00", null), new DetallePrestamo(),
                A_TIEMPO, CondicionRecibida.Bueno, null);

        verify(multaRepo, never()).save(any());
    }

    @Test
    void unDanoQuedaEnRevisionConMontoCeroHastaQueAlguienLoEvalue() {
        service.generarPorDevolucion(prestamo("1.00", null), new DetallePrestamo(),
                A_TIEMPO, CondicionRecibida.Danado, "Tapa rota");

        Multa m = multasGeneradas(1).get(0);
        assertThat(m.getTipoMulta()).isEqualTo(TipoMulta.Danio);
        assertThat(m.getEstado()).isEqualTo(EstadoMulta.EnRevision);
        assertThat(m.getMonto()).isEqualByComparingTo("0");
    }

    @Test
    void unaPerdidaConRetrasoGeneraDosMultas() {
        service.generarPorDevolucion(prestamo("1.00", null), new DetallePrestamo(),
                CUATRO_DIAS_DESPUES, CondicionRecibida.Perdido, "No lo encuentra");

        assertThat(multasGeneradas(2)).extracting(Multa::getTipoMulta)
                .containsExactlyInAnyOrder(TipoMulta.Retraso, TipoMulta.Perdida);
    }
}