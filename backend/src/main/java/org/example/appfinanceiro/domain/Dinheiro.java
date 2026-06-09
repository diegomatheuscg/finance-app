package org.example.appfinanceiro.domain;

import java.math.BigDecimal;

public class Dinheiro {
    private BigDecimal quantia;
    private final MoedaTipo moeda;

    public Dinheiro(BigDecimal quantia, MoedaTipo moeda) {
        this.quantia = quantia;
        this.moeda = moeda;
    }

    public Dinheiro somar(Dinheiro outro) {
        validar(outro);
        return new Dinheiro(this.quantia.add(outro.getQuantia()), outro.getMoeda());
    }

    public Dinheiro subtrair(Dinheiro outro) {
        validar(outro);
        if (!(this.quantia.compareTo(outro.getQuantia()) >= 0)) {
            throw new IllegalArgumentException("Saldo insuficiente.");
        }
        return new Dinheiro(this.quantia.subtract(outro.getQuantia()), outro.getMoeda());
    }

    private void validar(Dinheiro dinheiro) {
        if (dinheiro == null) {
            throw new IllegalArgumentException("O valor informado nÃ£o existe.");
        } else if (dinheiro.getQuantia().equals(BigDecimal.ZERO)) {
            throw new IllegalArgumentException("NÃ£o Ã© possÃ­vel somar ou subtrair 0.");
        }
    }

    public Dinheiro converterPara(Dinheiro dinheiro, MoedaTipo tipo) {
        return new Dinheiro(dinheiro.getQuantia(), tipo);
    }

    public BigDecimal getQuantia() {
        return quantia;
    }

    public MoedaTipo getMoeda() {
        return moeda;
    }
}

