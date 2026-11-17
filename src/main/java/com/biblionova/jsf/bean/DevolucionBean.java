package com.biblionova.jsf.bean;

import com.biblionova.jsf.entity.Prestamo;
import com.biblionova.jsf.repository.PrestamoRepository;
import com.biblionova.jsf.service.DevolucionService;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.util.List;

@Named("devolucionBean")
@RequestScoped
public class DevolucionBean {

    @Inject
    private DevolucionService devolucionService;

    @Inject
    private PrestamoRepository prestamoRepository;

    private Long prestamoId;
    private String mensaje;
    private boolean exitoso;

    // Registrar la devolución del préstamo seleccionado.
    public void devolver() {
        try {
            devolucionService.registrarDevolucion(prestamoId);

            mensaje = "Devolución registrada correctamente.";
            exitoso = true;
            prestamoId = null;

        } catch (IllegalArgumentException | IllegalStateException e) {
            mensaje = e.getMessage();
            exitoso = false;

        } catch (Exception e) {
            mensaje = "No se pudo registrar la devolución.";
            exitoso = false;
            e.printStackTrace();
        }
    }

    // Consultar solamente los préstamos activos.
    public List<Prestamo> getPrestamosActivos() {
        return prestamoRepository.listar()
                .stream()
                .filter(p -> "Activo".equals(p.getEstado()))
                .toList();
    }

    // Consultar el historial completo.
    public List<Prestamo> getPrestamos() {
        return prestamoRepository.listar();
    }

    public Long getPrestamoId() {
        return prestamoId;
    }

    public void setPrestamoId(Long prestamoId) {
        this.prestamoId = prestamoId;
    }

    public String getMensaje() {
        return mensaje;
    }

    public boolean isExitoso() {
        return exitoso;
    }
}
