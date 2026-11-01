package com.example.biblionova.prestamos.controller;

import com.example.biblionova.config.GestionPrestamos;
import com.example.biblionova.prestamos.dto.ArchivoEvidencia;
import com.example.biblionova.prestamos.dto.EvidenciaResponse;
import com.example.biblionova.prestamos.entity.TipoEvidencia;
import com.example.biblionova.prestamos.service.EvidenciaService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/prestamos/evidencias")
@RequiredArgsConstructor
@GestionPrestamos
public class EvidenciaController {
    private final EvidenciaService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public EvidenciaResponse subir(@RequestParam Integer ejemplarId,
                                   @RequestParam TipoEvidencia tipo,
                                   @RequestParam(required = false) Integer detallePrestamoId,
                                   @RequestParam(required = false) String descripcion,
                                   @RequestParam("archivo") MultipartFile archivo) throws IOException {
        return service.subir(ejemplarId, tipo, detallePrestamoId, descripcion, archivo);
    }

    @GetMapping("/ejemplar/{ejemplarId}")
    public List<EvidenciaResponse> listar(@PathVariable Integer ejemplarId) {
        return service.listar(ejemplarId);
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargar(@PathVariable Long id) {
        ArchivoEvidencia a = service.archivo(id);
        return ResponseEntity.ok()
                .contentType(a.tipo())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(a.recurso());
    }
}
