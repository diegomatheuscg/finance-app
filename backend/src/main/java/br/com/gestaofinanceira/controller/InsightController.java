package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.dashboard.DashboardSummaryResponse;
import br.com.gestaofinanceira.dto.insight.InsightResponse;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.Transacao;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.TransacaoRepository;
import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.DashboardService;
import br.com.gestaofinanceira.service.GeminiInsightService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets/{walletId}/insights")
public class InsightController {

    private final DashboardService dashboardService;
    private final CarteiraRepository carteiraRepository;
    private final TransacaoRepository transacaoRepository;
    private final GeminiInsightService geminiInsightService;

    public InsightController(
            DashboardService dashboardService,
            CarteiraRepository carteiraRepository,
            TransacaoRepository transacaoRepository,
            GeminiInsightService geminiInsightService) {
        this.dashboardService = dashboardService;
        this.carteiraRepository = carteiraRepository;
        this.transacaoRepository = transacaoRepository;
        this.geminiInsightService = geminiInsightService;
    }

    @PostMapping
    public InsightResponse generate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long walletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        DashboardSummaryResponse summary = dashboardService.summary(
                user.userId(), walletId, startDate, endDate);
        Carteira wallet = carteiraRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada"));
        List<Transacao> transactions = transacaoRepository.findByCarteiraIdAndDataBetween(
                walletId, startDate, endDate);
        return geminiInsightService.generate(wallet.getNome(), startDate, endDate, summary, transactions);
    }
}
