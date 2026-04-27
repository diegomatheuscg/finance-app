package domain;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TesteTransacao {

    @org.junit.jupiter.api.Test
    void naoPermitirSaldoNegativo(){
        Carteira carteira = new Carteira("Nubank", MoedaTipo.REAL);
        // Carteira está zerada, vou tentar debitar 50
        Dinheiro cinquentaReais = new Dinheiro(new BigDecimal("50"), MoedaTipo.REAL);
        Transacao compraCara = new Despesa("Compra Inválida", null, cinquentaReais);

        // Verifica se o seu "throw new IllegalArgumentException" lá do Dinheiro realmente é disparado!
        assertThrows(IllegalArgumentException.class, () -> {
            carteira.debitar(compraCara.getValor());
        });
    }
}