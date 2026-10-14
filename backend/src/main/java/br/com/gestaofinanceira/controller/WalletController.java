package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.wallet.WalletRequest;
import br.com.gestaofinanceira.dto.wallet.WalletResponse;
import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public ResponseEntity<List<WalletResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(walletService.list(user.userId()));
    }

    @GetMapping("/{walletId}")
    public ResponseEntity<WalletResponse> get(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId) {
        return ResponseEntity.ok(walletService.get(user.userId(), walletId));
    }

    @PostMapping
    public ResponseEntity<WalletResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody WalletRequest request) {
        WalletResponse created = walletService.create(user.userId(), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{walletId}")
    public ResponseEntity<WalletResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @Valid @RequestBody WalletRequest request) {
        return ResponseEntity.ok(walletService.update(user.userId(), walletId, request));
    }

    @DeleteMapping("/{walletId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId) {
        walletService.delete(user.userId(), walletId);
        return ResponseEntity.noContent().build();
    }
}