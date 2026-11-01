package com.example.biblionova.inventario.service;

import com.example.biblionova.inventario.dto.StockLibro;
import com.example.biblionova.inventario.repository.EjemplarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockService {
    private final EjemplarRepository repo;

    @Transactional(readOnly = true)
    public Map<Integer, StockLibro> porLibros(Collection<Integer> libroIds) {
        if (libroIds.isEmpty()) return Map.of();
        return repo.stockPorLibros(libroIds).stream()
                .collect(Collectors.toMap(StockLibro::libroId, Function.identity()));
    }

    @Transactional(readOnly = true)
    public StockLibro porLibro(Integer libroId) {
        return porLibros(List.of(libroId)).getOrDefault(libroId, StockLibro.vacio(libroId));
    }
}
