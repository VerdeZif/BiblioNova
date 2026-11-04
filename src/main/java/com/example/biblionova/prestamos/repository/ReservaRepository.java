package com.example.biblionova.prestamos.repository;

import com.example.biblionova.prestamos.entity.EstadoReserva;
import com.example.biblionova.prestamos.entity.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long>, JpaSpecificationExecutor<Reserva> {

    @Override
    @EntityGraph(attributePaths = {"lector", "libro", "ejemplar"})
    Page<Reserva> findAll(Specification<Reserva> spec, Pageable pageable);

    // Devuelve solo el id (no carga la entidad) para poder bloquear el ejemplar ANTES que la reserva
    @Query("select r.ejemplar.ejemplarId from Reserva r where r.reservaId = :id")
    Optional<Integer> ejemplarIdDe(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reserva r where r.reservaId = :id")
    Optional<Reserva> bloquearPorId(@Param("id") Long id);

    @Query("""
        select r from Reserva r where r.ejemplar.ejemplarId = :id
          and r.estado = com.example.biblionova.prestamos.entity.EstadoReserva.Confirmada
        """)
    Optional<Reserva> confirmadaDelEjemplar(@Param("id") Integer ejemplarId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select r from Reserva r where r.libro.libroId = :libroId
          and r.estado = com.example.biblionova.prestamos.entity.EstadoReserva.Pendiente
        order by r.fechaSolicitud, r.reservaId
        """)
    List<Reserva> colaPendiente(@Param("libroId") Integer libroId, Pageable pageable);

    @Query("""
        select r.reservaId from Reserva r
        where r.estado = com.example.biblionova.prestamos.entity.EstadoReserva.Confirmada
          and r.fechaExpiracion < :ahora
        """)
    List<Long> idsVencidas(@Param("ahora") LocalDateTime ahora);

    @Query("""
        select distinct r.libro.libroId from Reserva r
        where r.estado = com.example.biblionova.prestamos.entity.EstadoReserva.Pendiente
        """)
    List<Integer> libroIdsConPendientes();

    long countByLibro_LibroIdAndEstado(Integer libroId, EstadoReserva estado);
    long countByLector_LectorIdAndEstadoIn(Integer lectorId, Collection<EstadoReserva> estados);
    boolean existsByLector_LectorIdAndLibro_LibroIdAndEstadoIn(Integer lectorId, Integer libroId,
                                                               Collection<EstadoReserva> estados);
}
