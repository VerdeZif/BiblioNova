package com.example.biblionova.prestamos.service;

import com.example.biblionova.auditoria.service.AuditoriaService;
import com.example.biblionova.common.exception.ConflictoException;
import com.example.biblionova.common.exception.RecursoNoEncontradoException;
import com.example.biblionova.prestamos.dto.PoliticaRequest;
import com.example.biblionova.prestamos.dto.PoliticaResponse;
import com.example.biblionova.prestamos.entity.PoliticaPrestamo;
import com.example.biblionova.prestamos.repository.PoliticaPrestamoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.example.biblionova.auditoria.service.AuditoriaService.datos;

@Service
@RequiredArgsConstructor
public class PoliticaService {
    private final PoliticaPrestamoRepository repo;
    private final AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public List<PoliticaResponse> listar() {
        return repo.findAllByOrderByNombre().stream().map(this::aResponse).toList();
    }

    @Transactional
    public PoliticaResponse crear(PoliticaRequest r) {
        String nombre = r.nombre().trim();
        if (repo.existsByNombre(nombre)) throw new ConflictoException("Ya existe una política con ese nombre");
        PoliticaPrestamo p = new PoliticaPrestamo();
        p.setNombre(nombre);
        p.setDiasPrestamo(r.diasPrestamo());
        p.setMaxEjemplares(r.maxEjemplares());
        p.setTarifaRetrasoDiaria(r.tarifaRetrasoDiaria());
        p.setMaxMultaRetraso(r.maxMultaRetraso());
        p.setActiva(false);
        PoliticaPrestamo guardada = repo.save(p);
        auditoria.registrar("PoliticaPrestamo", guardada.getPoliticaId(), "CREAR", "Política creada: " + nombre,
                null, aResponse(guardada));
        return aResponse(guardada);
    }

    @Transactional
    public PoliticaResponse activar(Integer id) {
        if (!repo.existsById(id)) throw new RecursoNoEncontradoException("Política", id);
        Integer anterior = repo.findFirstByActivaTrueOrderByPoliticaIdAsc()
                .map(PoliticaPrestamo::getPoliticaId).orElse(null);
        repo.desactivarOtras(id);
        PoliticaPrestamo p = repo.findById(id).orElseThrow();
        p.setActiva(true);
        auditoria.registrar("PoliticaPrestamo", id, "ACTIVAR", "Política activada: " + p.getNombre(),
                datos("politicaActivaAnterior", anterior), aResponse(p));
        return aResponse(p);
    }

    private PoliticaResponse aResponse(PoliticaPrestamo p) {
        return new PoliticaResponse(p.getPoliticaId(), p.getNombre(), p.getDiasPrestamo(),
                p.getMaxEjemplares(), p.getTarifaRetrasoDiaria(), p.getMaxMultaRetraso(), p.isActiva());
    }
}
