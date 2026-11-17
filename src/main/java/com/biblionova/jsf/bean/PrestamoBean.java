
package com.biblionova.jsf.bean;

import com.biblionova.jsf.entity.Ejemplar;
import com.biblionova.jsf.entity.Prestamo;
import com.biblionova.jsf.entity.Usuario;
import com.biblionova.jsf.repository.EjemplarRepository;
import com.biblionova.jsf.repository.PrestamoRepository;
import com.biblionova.jsf.repository.UsuarioRepository;
import com.biblionova.jsf.service.PrestamoService;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;

import java.time.LocalDate;
import java.util.List;

@Named("prestamoBean")
@RequestScoped
public class PrestamoBean {

    @Inject
    private PrestamoService prestamoService;

    @Inject
    private PrestamoRepository prestamoRepository;

    @Inject
    private UsuarioRepository usuarioRepository;

    @Inject
    private EjemplarRepository ejemplarRepository;

    private Long usuarioId;
    private Long ejemplarId;

    // La fecha se recibirá desde el formulario HTML.
    private String fechaVencimiento;

    private String mensaje;

    public void guardar() {
        try {
            if (fechaVencimiento == null ||
                    fechaVencimiento.isBlank()) {
                mensaje = "Debes seleccionar una fecha de vencimiento.";
                return;
            }

            LocalDate fecha = LocalDate.parse(fechaVencimiento);

            prestamoService.registrarPrestamo(
                    usuarioId,
                    ejemplarId,
                    fecha
            );

            mensaje = "Préstamo registrado correctamente.";

            usuarioId = null;
            ejemplarId = null;
            fechaVencimiento = null;

        } catch (IllegalArgumentException | IllegalStateException e) {
            mensaje = e.getMessage();

        } catch (Exception e) {
            e.printStackTrace();
            mensaje = "Error al registrar préstamo: "
                    + e.getClass().getSimpleName()
                    + " - " + e.getMessage();
        }
    }

    public List<Prestamo> getPrestamos() {
        return prestamoRepository.listar();
    }

    public List<Usuario> getUsuarios() {
        return usuarioRepository.listar();
    }

    public List<Ejemplar> getEjemplaresDisponibles() {
        return ejemplarRepository.listar()
                .stream()
                .filter(e -> "Disponible".equals(e.getEstado()))
                .toList();
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Long getEjemplarId() {
        return ejemplarId;
    }

    public void setEjemplarId(Long ejemplarId) {
        this.ejemplarId = ejemplarId;
    }

    public String getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(String fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public String getMensaje() {
        return mensaje;
    }
}
