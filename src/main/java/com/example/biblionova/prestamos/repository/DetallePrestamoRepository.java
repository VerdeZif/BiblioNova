package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.DetallePrestamo;
import com.example.biblionova.prestamos.entity.EstadoDetallePrestamo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DetallePrestamoRepository extends JpaRepository<DetallePrestamo, Integer> {

    @Query("""
        select d from DetallePrestamo d
        join fetch d.ejemplar e join fetch e.libro
        where d.prestamo.prestamoId = :id order by d.detallePrestamoId
        """)
    List<DetallePrestamo> porPrestamo(@Param("id") Integer prestamoId);

    @Query("select d.ejemplar.ejemplarId from DetallePrestamo d where d.prestamo.prestamoId = :id")
    List<Integer> idsEjemplares(@Param("id") Integer prestamoId);

    long countByPrestamo_Lector_LectorIdAndEstadoDetalle(Integer lectorId, EstadoDetallePrestamo estado);
}
