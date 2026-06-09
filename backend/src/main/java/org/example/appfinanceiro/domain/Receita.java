package org.example.appfinanceiro.domain;

public class Receita extends TransacaoBase {


    public Receita(String descricao, Categoria categoria, Dinheiro valor) {
        super(descricao, categoria, valor);
    }

    @Override
    public void aplicarTransacao(Carteira carteira, Dinheiro valorEfetivo) {
        if (carteira == null) {
            System.out.println("A carteira estÃ¡ vazia");
            return;
        }
        carteira.creditar(valorEfetivo);
    }
}

