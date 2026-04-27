package application;

import domain.Dinheiro;
import domain.MoedaTipo;

import java.math.BigDecimal;

public class ConverterDinheiroUseCase {
    private static final BigDecimal TAXA_USD = new BigDecimal("4.98");


    public ConverterDinheiroUseCase(){

    }

    public void executar(Dinheiro dinheiro, MoedaTipo tipoDesejado){
        if(tipoDesejado.equals(MoedaTipo.DOLAR)){
            BigDecimal quantiaDolar = dinheiro.getQuantia().multiply(TAXA_USD);
            dinheiro = dinheiro.converterPara(dinheiro, tipoDesejado);
        }
    }
}
