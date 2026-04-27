package application;

import domain.Carteira;
import domain.Transacao;

import java.time.LocalDateTime;

public class RegistrarReceitaUseCase {


    public RegistrarReceitaUseCase() {
    }

    public void registrar(Carteira carteira, Transacao transacao){
        carteira.processarTransacao(transacao);
    }
}
