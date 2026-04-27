package domain;

import java.time.LocalDateTime;


public interface Transacao {
   void aplicarTransacao(Carteira carteira, Dinheiro efetivo);


   String getDescricao();
   Categoria getCategoria();
   Dinheiro getValor();
   LocalDateTime getDataTransacao();
}
