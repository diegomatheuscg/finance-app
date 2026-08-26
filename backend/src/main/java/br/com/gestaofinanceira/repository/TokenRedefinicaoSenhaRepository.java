package br.com.gestaofinanceira.repository;

import br.com.gestaofinanceira.entity.TokenRedefinicaoSenha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenRedefinicaoSenhaRepository extends JpaRepository<TokenRedefinicaoSenha, Long> {

    Optional<TokenRedefinicaoSenha> findByToken(String token);

    Optional<TokenRedefinicaoSenha> findByUsuarioId(Long usuarioId);
}
