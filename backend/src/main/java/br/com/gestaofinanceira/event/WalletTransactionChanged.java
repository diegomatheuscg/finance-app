package br.com.gestaofinanceira.event;

public record WalletTransactionChanged(Long walletId, Action action, Long transactionId) {

    public enum Action {
        CREATED,
        UPDATED,
        DELETED
    }
}
