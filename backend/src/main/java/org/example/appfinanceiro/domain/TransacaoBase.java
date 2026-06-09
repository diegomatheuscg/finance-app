package org.example.appfinanceiro.domain;

import java.time.LocalDateTime;

public abstract class TransacaoBase implements Transacao{
    private String descricao;
    private Dinheiro valor;
    private LocalDateTime dataTransacao;
    private Categoria categoria;

    public TransacaoBase(String descricao, Categoria categoria, Dinheiro valor) {
        this.descricao = descricao.trim();
        this.categoria = categoria;
        this.valor = valor;
        this.dataTransacao = LocalDateTime.now();
    }

    public abstract void aplicarTransacao(Carteira carteira, Dinheiro valorEfetivo);

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public LocalDateTime getDataTransacao() {
        return dataTransacao;
    }

    public void setDataTransacao(LocalDateTime dataTransacao) {
        this.dataTransacao = dataTransacao;
    }

    @Override
    public Dinheiro getValor() {
        return valor;
    }

    public void setValor(Dinheiro valor) {
        this.valor = valor;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}

