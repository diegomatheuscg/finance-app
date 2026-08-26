package br.com.gestaofinanceira.repository;

import br.com.gestaofinanceira.entity.CarteiraMembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarteiraMembroRepository extends JpaRepository<CarteiraMembro, Long> {

    List<CarteiraMembro> findByCarteiraId(Long carteiraId);

    Optional<CarteiraMembro> findByCarteiraIdAndUsuarioId(Long carteiraId, Long usuarioId);

    Optional<CarteiraMembro> findByCarteiraIdAndUsuarioEmail(Long carteiraId, String email);

    boolean existsByCarteiraIdAndUsuarioId(Long carteiraId, Long usuarioId);

    boolean existsByCarteiraIdAndUsuarioEmail(Long carteiraId, String email);

    void deleteByCarteiraIdAndUsuarioId(Long carteiraId, Long usuarioId);
}
