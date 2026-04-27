package application;

import domain.Dinheiro;
import domain.MoedaTipo;

import java.math.BigDecimal;

public class ConverterDinheiroUseCase {
    private static final BigDecimal TAXA_USD = new BigDecimal("4.98");

    public ConverterDinheiroUseCase() {

    }

    public Dinheiro executar(Dinheiro dinheiro) {
        if (dinheiro == null) {
            throw new IllegalArgumentException("O dinheiro precisa existir");

        }
        MoedaTipo tipo = dinheiro.getMoeda();

        if (tipo.equals(MoedaTipo.DOLAR)) {
            BigDecimal quantiaDolar = dinheiro.getQuantia().multiply(TAXA_USD);
            return new Dinheiro(quantiaDolar, MoedaTipo.REAL);
        }

        return dinheiro;
    }
}
