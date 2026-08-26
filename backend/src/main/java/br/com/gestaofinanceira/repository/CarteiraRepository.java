package br.com.gestaofinanceira.repository;

import br.com.gestaofinanceira.entity.Carteira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarteiraRepository extends JpaRepository<Carteira, Long> {

    @Query("SELECT DISTINCT c FROM Carteira c LEFT JOIN c.membros m WHERE c.dono.id = :usuarioId OR m.usuario.id = :usuarioId")
    List<Carteira> findAllByUsuarioDonoOrMembro(@Param("usuarioId") Long usuarioId);

    Optional<Carteira> findByIdAndDonoId(Long id, Long donoId);
}
