package org.example.appfinanceiro.domain;

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

    public Carteira(String titulo) {
        this.titulo = titulo;
        this.dataCriacao = LocalDateTime.now();
        this.saldo = new Dinheiro(BigDecimal.ZERO, MoedaTipo.REAL);
        this.transacaoList = new ArrayList<>();
    }

    public void processarTransacao(Transacao transacao, Dinheiro valorEfetivo) {
        if (transacao == null) {
            throw new IllegalArgumentException("A transaÃ§Ã£o nÃ£o pode ser nula.");
        }
        transacao.aplicarTransacao(this, valorEfetivo);
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
            throw new IllegalArgumentException("Ã‰ necessÃ¡rio informar um valor.");
        }
    }

    public void exibirSaldo() {
        StringBuilder sb = new StringBuilder();
        String texto = "Saldo de " + titulo + ": " + saldo.getQuantia().toString();
        String ultima = "Ãšltima modificaÃ§Ã£o: " + dataModificacao.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        sb.append(texto).append(ultima);
        System.out.println(texto);
    }

    public void listarTransacoes() {
        if (transacaoList.isEmpty()) {
            System.out.println("NÃ£o existem transaÃ§Ãµes realizadas nessa carteira");
            return;
        }

        StringBuilder sb = new StringBuilder();

        sb.append("Lista de transaÃ§Ãµes\n").append("-------------------------\n");
        for (Transacao t : transacaoList) {
            sb.append("DescriÃ§Ã£o: " + t.getDescricao() + "\n");
            sb.append("Categoria: " + t.getCategoria().getDescricao() + "\n");
            sb.append("Valor: " + t.getValor().getQuantia() + "\n");
            DateTimeFormatter formatoPadrao = DateTimeFormatter.ofPattern("dd/mm/yyyy hh:mm:ss");
            sb.append("Data: " + t.getDataTransacao().format(formatoPadrao) + "\n");
            sb.append("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
        }
        System.out.println(sb);
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

