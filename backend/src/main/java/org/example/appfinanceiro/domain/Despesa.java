package org.example.appfinanceiro.domain;

import java.time.LocalDateTime;

public class Despesa extends TransacaoBase {


    public Despesa(String descricao, Categoria categoria, Dinheiro valor) {
        super(descricao, categoria, valor);
    }

    @Override
    public void aplicarTransacao(Carteira carteira, Dinheiro valorEfetivo) {
        if (carteira == null) {
            System.out.println("A carteira estÃ¡ vazia");
            return;
        }
        carteira.debitar(valorEfetivo);
    }
}

