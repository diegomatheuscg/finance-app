package main;

import application.ProcessarTransacaoUseCase;
import domain.*;

import java.math.BigDecimal;
import java.util.Scanner;

public class Main {

    static void main() {
        Carteira carteira = new Carteira("Nubank");
        Dinheiro valor1 = new Dinheiro(new BigDecimal("500"), MoedaTipo.REAL);
        Dinheiro valor2 = new Dinheiro(new BigDecimal("500"), MoedaTipo.DOLAR);

        Categoria categoria = new Categoria("Mercado", "Compras efetuadas no mercado");

        Transacao receita1 = new Receita("PIX do Ali Osmar Chehade", categoria, valor1);
        Transacao receita2 = new Receita("Salário", categoria, valor2);

        ProcessarTransacaoUseCase processar = new ProcessarTransacaoUseCase();

        processar.executar(carteira, receita1);
        processar.executar(carteira, receita2);

        carteira.exibirSaldo();
        carteira.listarTransacoes();

    }
}
