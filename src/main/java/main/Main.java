package main;

import application.RegistrarReceitaUseCase;
import domain.*;

import java.math.BigDecimal;
import java.util.Scanner;

public class Main {

    static void main() {
        Carteira carteira = new Carteira("Nubank", MoedaTipo.REAL);
        Dinheiro valor1 = new Dinheiro(new BigDecimal("500"), MoedaTipo.REAL);
        Categoria categoria = new Categoria("Mercado", "Compras efetuadas no mercado");

        Transacao receita = new Receita("Compras no cidade canção", categoria, valor1);

        RegistrarReceitaUseCase caso = new RegistrarReceitaUseCase();
        caso.registrar(carteira, receita);
    }
}
