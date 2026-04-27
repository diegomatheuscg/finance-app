package domain;

import java.time.LocalDateTime;


public interface Transacao {
   void aplicarTransacao(Carteira carteira);

   Dinheiro getValor();
   LocalDateTime getDataTransacao();
}
