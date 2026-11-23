package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.WalletEventService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletEventController {

    private final WalletEventService walletEventService;

    public WalletEventController(WalletEventService walletEventService) {
        this.walletEventService = walletEventService;
    }

    @GetMapping(value = "/{walletId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId) {
        return walletEventService.subscribe(walletId, user.userId());
    }
}
