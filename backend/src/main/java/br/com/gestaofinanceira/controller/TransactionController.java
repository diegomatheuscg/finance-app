package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.transaction.TransactionRequest;
import br.com.gestaofinanceira.dto.transaction.TransactionResponse;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/wallets/{walletId}/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @RequestParam(required = false) TipoTransacao type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort) {
        return ResponseEntity.ok(transactionService.list(
                user.userId(), walletId, type, categoryId, startDate, endDate, page, size, sort));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> get(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @PathVariable Long transactionId) {
        return ResponseEntity.ok(transactionService.get(user.userId(), walletId, transactionId));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @Valid @RequestBody TransactionRequest request) {
        TransactionResponse created = transactionService.create(user.userId(), walletId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @PathVariable Long transactionId,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.update(
                user.userId(), walletId, transactionId, request));
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @PathVariable Long transactionId) {
        transactionService.delete(user.userId(), walletId, transactionId);
        return ResponseEntity.noContent().build();
    }
}