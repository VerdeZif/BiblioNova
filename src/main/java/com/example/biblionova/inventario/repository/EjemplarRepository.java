package com.example.biblionova.inventario.repository;

import com.example.biblionova.inventario.dto.StockLibro;
import com.example.biblionova.inventario.entity.Ejemplar;
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
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EjemplarRepository extends JpaRepository<Ejemplar, Integer>, JpaSpecificationExecutor<Ejemplar> {

    @Override
    @EntityGraph(attributePaths = {"libro", "ubicacion"})
    Page<Ejemplar> findAll(Specification<Ejemplar> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"libro", "ubicacion"})
    Optional<Ejemplar> findWithDetalleByEjemplarId(Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Ejemplar e where e.ejemplarId = :id")
    Optional<Ejemplar> bloquearPorId(@Param("id") Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Ejemplar e where e.ejemplarId in :ids order by e.ejemplarId")
    List<Ejemplar> bloquearPorIds(@Param("ids") Collection<Integer> ids);

    @Query("""
        select e from Ejemplar e join fetch e.detalleRecepcion d
        where d.recepcion.recepcionId = :id order by e.ejemplarId
        """)
    List<Ejemplar> porRecepcion(@Param("id") Long recepcionId);

    @Query("""
        select new com.example.biblionova.inventario.dto.StockLibro(
            e.libro.libroId,
            count(case when e.estado = com.example.biblionova.inventario.entity.EstadoEjemplar.Disponible
                        and e.esVendible = true then 1 end),
            count(case when e.estado = com.example.biblionova.inventario.entity.EstadoEjemplar.Disponible
                        and e.esPrestamo = true then 1 end),
            count(case when e.estado <> com.example.biblionova.inventario.entity.EstadoEjemplar.Vendido
                        and e.estado <> com.example.biblionova.inventario.entity.EstadoEjemplar.Baja then 1 end))
        from Ejemplar e
        where e.libro.libroId in :ids
        group by e.libro.libroId
        """)
    List<StockLibro> stockPorLibros(@Param("ids") Collection<Integer> ids);

    // CORREGIDO: Ahora usa @Lock de Spring en vez de LockModeType directo de Yakarta como anotación
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Ejemplar e where lower(e.codigoEjemplar) in :codigos order by e.ejemplarId")
    List<Ejemplar> bloquearPorCodigos(@Param("codigos") Collection<String> codigos);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select e from Ejemplar e
        where e.libro.libroId = :libroId and e.esPrestamo = true
          and e.estado = com.example.biblionova.inventario.entity.EstadoEjemplar.Disponible
        order by e.ejemplarId
        """)
    List<Ejemplar> disponiblesParaPrestamo(@Param("libroId") Integer libroId, org.springframework.data.domain.Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select e from Ejemplar e
    where e.libro.libroId = :libroId and e.esVendible = true
      and e.estado = com.example.biblionova.inventario.entity.EstadoEjemplar.Disponible
    order by e.ejemplarId
    """)
    List<Ejemplar> disponiblesParaVenta(@Param("libroId") Integer libroId, Pageable pageable);
}
