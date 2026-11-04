package com.example.biblionova.inventario.service;

import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.inventario.entity.Ejemplar;
import com.example.biblionova.inventario.entity.EstadoEjemplar;
import com.example.biblionova.inventario.entity.Movimiento;
import com.example.biblionova.inventario.entity.TipoMovimiento;
import com.example.biblionova.inventario.repository.MovimientoRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository repo;

    /**
     * Cambia el estado de un ejemplar y deja el movimiento. El ejemplar DEBE venir ya bloqueado
     * (EjemplarRepository.bloquearPorId / bloquearPorIds) dentro de la misma transacción.
     * MANDATORY: si alguien lo llama sin transacción abierta, falla en vez de fallar en silencio.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Movimiento cambiarEstado(Ejemplar e, EstadoEjemplar nuevo, TipoMovimiento tipo, Usuario usuario,
                                    String referenciaTipo, Long referenciaId, String motivo) {
        EstadoEjemplar anterior = e.getEstado();
        if (!anterior.destinosPermitidos().contains(nuevo)) {
            throw new ConflictoException("Ejemplar %s: no se puede pasar de %s a %s"
                    .formatted(e.getCodigoEjemplar(), anterior, nuevo));
        }
        e.setEstado(nuevo);
        return guardar(e, usuario, tipo, anterior, nuevo, referenciaTipo, referenciaId, motivo);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Movimiento registrarEntrada(Ejemplar e, Usuario usuario, String referenciaTipo,
                                       Long referenciaId, String motivo) {
        return guardar(e, usuario, TipoMovimiento.Entrada, null, e.getEstado(), referenciaTipo, referenciaId, motivo);
    }

    /** Cambios que no alteran el estado (ubicación, destino venta/préstamo, condición). */
    @Transactional(propagation = Propagation.MANDATORY)
    public Movimiento registrarAjuste(Ejemplar e, Usuario usuario, String motivo) {
        return guardar(e, usuario, TipoMovimiento.Ajuste, e.getEstado(), e.getEstado(), "AjusteManual", null, motivo);
    }

    private Movimiento guardar(Ejemplar e, Usuario u, TipoMovimiento tipo, EstadoEjemplar antes,
                               EstadoEjemplar despues, String refTipo, Long refId, String motivo) {
        Movimiento m = new Movimiento();
        m.setEjemplar(e);
        m.setUsuario(u);
        m.setTipoMovimiento(tipo);
        m.setEstadoAnterior(antes);
        m.setEstadoNuevo(despues);
        m.setReferenciaTipo(refTipo);
        m.setReferenciaId(refId);
        m.setMotivo(motivo);
        return repo.save(m);
    }
}
