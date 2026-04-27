package domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class Carteira {
    private String titulo;
    private Dinheiro saldo;
    private final LocalDateTime dataCriacao;
    private LocalDateTime dataModificacao;
    List<Transacao> transacaoList;

    public Carteira(String titulo, MoedaTipo tipo) {
        this.titulo = titulo;
        this.dataCriacao = LocalDateTime.now();
        this.saldo = new Dinheiro(BigDecimal.ZERO, tipo);
        this.transacaoList = new ArrayList<>();
    }

    public void processarTransacao(Transacao transacao) {
        if (transacao == null) {
            throw new IllegalArgumentException("A transação não pode ser nula.");
        }
        transacao.aplicarTransacao(this);
        this.transacaoList.add(transacao);
        dataModificacao = LocalDateTime.now();
    }

    public void creditar(Dinheiro valor) {
        valorExiste(valor);
        saldo = saldo.somar(valor);
    }

    public void debitar(Dinheiro valor) {
        valorExiste(valor);
        if ((this.saldo.getQuantia().compareTo(valor.getQuantia()) < 0)) {
            throw new IllegalArgumentException("Saldo insuficiente.");
        }
        saldo = saldo.subtrair(valor);
    }

    public void valorExiste(Dinheiro valor) {
        if (valor == null) {
            throw new IllegalArgumentException("É necessário informar um valor.");
        }
    }

    public void exibirSaldo() {
        StringBuilder sb = new StringBuilder();
        String texto = "Saldo de " + titulo + ": " + saldo.getQuantia().toString();
        String ultima = "Última modificação: " + dataModificacao.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        sb.append(texto).append(ultima);
        System.out.println(texto);
    }

    public String getTitulo() {
        return this.titulo;
    }

    public LocalDateTime getDataCriacao() {
        return this.dataCriacao;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public Dinheiro getSaldo() {
        return saldo;
    }

    public void setSaldo(Dinheiro saldo) {
        this.saldo = saldo;
    }

    public LocalDateTime getDataModificacao() {
        return dataModificacao;
    }

    public void setDataModificacao(LocalDateTime dataModificacao) {
        this.dataModificacao = dataModificacao;
    }

    public List<Transacao> getTransacaoList() {
        return transacaoList;
    }

    public void setTransacaoList(List<Transacao> transacaoList) {
        this.transacaoList = transacaoList;
    }
}
