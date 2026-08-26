package br.com.gestaofinanceira.repository;

import br.com.gestaofinanceira.entity.Transacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransacaoRepository extends JpaRepository<Transacao, Long>, JpaSpecificationExecutor<Transacao> {

    Page<Transacao> findByCarteiraId(Long carteiraId, Pageable pageable);

    Optional<Transacao> findByIdAndCarteiraId(Long id, Long carteiraId);

    boolean existsByCategoriaId(Long categoriaId);

    List<Transacao> findByCarteiraIdAndDataBetween(Long carteiraId, LocalDate dataInicio, LocalDate dataFim);
}
