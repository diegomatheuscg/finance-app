package domain;

public class Receita extends TransacaoBase {


    public Receita(String descricao, Categoria categoria, Dinheiro valor) {
        super(descricao, categoria, valor);
    }

    @Override
    public void aplicarTransacao(Carteira carteira) {
        if (carteira == null) {
            System.out.println("A carteira está vazia");
            return;
        }
        carteira.creditar(getValor());
    }
}
