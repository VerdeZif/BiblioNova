package com.example.biblionova.comercio.service;

import com.example.biblionova.comercio.dto.DireccionRequest;
import com.example.biblionova.comercio.dto.DireccionResponse;
import com.example.biblionova.comercio.entity.DireccionEntrega;
import com.example.biblionova.comercio.entity.EstadoPedido;
import com.example.biblionova.comercio.repository.DireccionEntregaRepository;
import com.example.biblionova.comercio.repository.PedidoRepository;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.prestamos.entity.Lector;
import com.example.biblionova.prestamos.repository.LectorRepository;
import com.example.biblionova.seguridad.entity.Usuario;
import com.example.biblionova.seguridad.service.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DireccionService {

    private static final Set<EstadoPedido> FINALES = EnumSet.of(EstadoPedido.Entregado, EstadoPedido.Cancelado);
    private static final int MAX_DIRECCIONES = 10;

    private final DireccionEntregaRepository repo;
    private final LectorRepository lectorRepo;
    private final PedidoRepository pedidoRepo;
    private final UsuarioActual usuarioActual;

    @Transactional(readOnly = true)
    public List<DireccionResponse> listar() {
        return repo.findByLector_LectorIdOrderByPredeterminadaDescDireccionIdDesc(lectorActual().getLectorId())
                .stream().map(DireccionResponse::de).toList();
    }

    @Transactional
    public DireccionResponse crear(DireccionRequest r) {
        Lector l = lectorActual();
        long cantidad = repo.countByLector_LectorId(l.getLectorId());
        if (cantidad >= MAX_DIRECCIONES)
            throw new ConflictoException("Alcanzaste el máximo de %d direcciones".formatted(MAX_DIRECCIONES));

        DireccionEntrega d = new DireccionEntrega();
        d.setLector(l);
        copiar(d, r);
        d.setPredeterminada(cantidad == 0 || Boolean.TRUE.equals(r.predeterminada()));
        repo.save(d);
        if (d.isPredeterminada()) repo.desmarcarOtras(l.getLectorId(), d.getDireccionId());
        return DireccionResponse.de(d);
    }

    @Transactional
    public DireccionResponse actualizar(Long id, DireccionRequest r) {
        Lector l = lectorActual();
        DireccionEntrega d = repo.findByDireccionIdAndLector_LectorId(id, l.getLectorId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección", id));
        verificarSinPedidosEnCurso(id);
        copiar(d, r);
        if (Boolean.TRUE.equals(r.predeterminada())) {
            d.setPredeterminada(true);
            repo.desmarcarOtras(l.getLectorId(), id);
        }
        return DireccionResponse.de(d);
    }

    @Transactional
    public void eliminar(Long id) {
        Lector l = lectorActual();
        DireccionEntrega d = repo.findByDireccionIdAndLector_LectorId(id, l.getLectorId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección", id));
        verificarSinPedidosEnCurso(id);
        boolean eraPredeterminada = d.isPredeterminada();
        repo.delete(d);
        repo.flush();            // si un pedido anterior la usó, la FK falla aquí y el handler responde 409
        if (eraPredeterminada) {
            repo.findFirstByLector_LectorIdOrderByDireccionIdDesc(l.getLectorId())
                    .ifPresent(otra -> otra.setPredeterminada(true));
        }
    }

    private void verificarSinPedidosEnCurso(Long direccionId) {
        if (pedidoRepo.existsByDireccion_DireccionIdAndEstadoNotIn(direccionId, FINALES))
            throw new ConflictoException("La dirección está en uso por un pedido en curso");
    }

    private Lector lectorActual() {
        Usuario u = usuarioActual.obtener();
        return lectorRepo.findByUsuario_UsuarioId(u.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Lector del usuario", u.getNombreUsuario()));
    }

    private void copiar(DireccionEntrega d, DireccionRequest r) {
        d.setDestinatario(r.destinatario().trim());
        d.setTelefono(r.telefono().trim());
        d.setDepartamento(r.departamento());
        d.setProvincia(r.provincia());
        d.setDistrito(r.distrito().trim());
        d.setDireccion(r.direccion().trim());
        d.setReferencia(r.referencia());
    }
}