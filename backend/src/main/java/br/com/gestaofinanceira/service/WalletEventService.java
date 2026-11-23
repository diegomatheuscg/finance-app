package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.event.WalletTransactionChanged;
import br.com.gestaofinanceira.repository.CarteiraMembroRepository;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WalletEventService {

    private static final Logger logger = LoggerFactory.getLogger(WalletEventService.class);
    private static final long EMITTER_TIMEOUT_MILLIS = 5 * 60 * 1000L;

    private final Map<Long, Set<Subscription>> subscriptions = new ConcurrentHashMap<>();
    private final CarteiraRepository carteiraRepository;
    private final CarteiraMembroRepository membroRepository;

    public WalletEventService(
            CarteiraRepository carteiraRepository,
            CarteiraMembroRepository membroRepository) {
        this.carteiraRepository = carteiraRepository;
        this.membroRepository = membroRepository;
    }

    public SseEmitter subscribe(Long walletId, Long userId) {
        if (!isMember(walletId, userId)) {
            throw new AccessDeniedException("Você não é membro desta carteira");
        }

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MILLIS);
        Subscription subscription = new Subscription(userId, emitter);
        subscriptions.compute(walletId, (id, current) -> {
            Set<Subscription> walletSubscriptions = current == null
                    ? ConcurrentHashMap.newKeySet()
                    : current;
            walletSubscriptions.add(subscription);
            return walletSubscriptions;
        });

        Runnable cleanup = () -> removeSubscription(walletId, subscription);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(() -> {
            cleanup.run();
            emitter.complete();
        });
        emitter.onError(error -> cleanup.run());
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException exception) {
            cleanup.run();
            emitter.completeWithError(exception);
            throw new IllegalStateException("Não foi possível iniciar o fluxo de eventos da carteira", exception);
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void broadcast(WalletTransactionChanged event) {
        Set<Subscription> walletSubscriptions = subscriptions.get(event.walletId());
        if (walletSubscriptions == null) {
            return;
        }

        for (Subscription subscription : walletSubscriptions) {
            try {
                if (!isMember(event.walletId(), subscription.userId())) {
                    removeSubscription(event.walletId(), subscription);
                    subscription.emitter().complete();
                    continue;
                }

                subscription.emitter().send(SseEmitter.event()
                        .name("transaction-changed")
                        .data(event, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException exception) {
                removeSubscription(event.walletId(), subscription);
                logger.debug("Encerrando conexão SSE indisponível da carteira {}", event.walletId(), exception);
            } catch (RuntimeException exception) {
                removeSubscription(event.walletId(), subscription);
                subscription.emitter().completeWithError(exception);
                logger.error("Falha ao validar ou enviar evento SSE da carteira {}", event.walletId(), exception);
            }
        }
    }

    private boolean isMember(Long walletId, Long userId) {
        return carteiraRepository.findByIdAndDonoId(walletId, userId).isPresent()
                || membroRepository.existsByCarteiraIdAndUsuarioId(walletId, userId);
    }

    private void removeSubscription(Long walletId, Subscription subscription) {
        subscriptions.computeIfPresent(walletId, (id, walletSubscriptions) -> {
            walletSubscriptions.remove(subscription);
            return walletSubscriptions.isEmpty() ? null : walletSubscriptions;
        });
    }

    private record Subscription(Long userId, SseEmitter emitter) {
    }
}
