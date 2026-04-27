package domain;

import java.time.LocalDateTime;

public class Despesa extends TransacaoBase {


    public Despesa(String descricao, Categoria categoria, Dinheiro valor) {
        super(descricao, categoria, valor);
    }

    @Override
    public void aplicarTransacao(Carteira carteira) {
        if (carteira == null) {
            System.out.println("A carteira está vazia");
            return;
        }
        carteira.debitar(getValor());
    }
}
