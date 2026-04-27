package application;

import domain.Carteira;
import domain.Dinheiro;
import domain.Transacao;

public class ProcessarTransacaoUseCase {


    public ProcessarTransacaoUseCase() {
    }

    public void executar(Carteira carteira, Transacao transacao){
        Dinheiro dinheiroTransacao = transacao.getValor();

        if(!carteira.getSaldo().getMoeda().equals(transacao.getValor().getMoeda())){
            ConverterDinheiroUseCase conversao = new ConverterDinheiroUseCase();
            dinheiroTransacao = conversao.executar(dinheiroTransacao);

        }
        carteira.processarTransacao(transacao, dinheiroTransacao);
    }
}
