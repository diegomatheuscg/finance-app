package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.dashboard.CategorySummaryDto;
import br.com.gestaofinanceira.dto.dashboard.DashboardSummaryResponse;
import br.com.gestaofinanceira.dto.dashboard.MonthlySummaryDto;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.CarteiraMembro;
import br.com.gestaofinanceira.entity.Categoria;
import br.com.gestaofinanceira.entity.Transacao;
import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraMembroRepository;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.TransacaoRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final CarteiraRepository carteiraRepository;
    private final CarteiraMembroRepository membroRepository;
    private final TransacaoRepository transacaoRepository;

    public DashboardService(
            CarteiraRepository carteiraRepository,
            CarteiraMembroRepository membroRepository,
            TransacaoRepository transacaoRepository) {
        this.carteiraRepository = carteiraRepository;
        this.membroRepository = membroRepository;
        this.transacaoRepository = transacaoRepository;
    }

    public DashboardSummaryResponse summary(
            Long userId, Long walletId, LocalDate startDate, LocalDate endDate) {
        findWalletForMember(walletId, userId);
        LocalDate start = startDate == null ? LocalDate.now().withDayOfMonth(1) : startDate;
        LocalDate end = endDate == null ? LocalDate.now() : endDate;
        if (start.isAfter(end)) {
            throw new br.com.gestaofinanceira.exception.BusinessException(
                    "A data inicial não pode ser posterior à data final");
        }

        List<Transacao> transacoes = transacaoRepository.findByCarteiraIdAndDataBetween(walletId, start, end);
        BigDecimal income = totalByType(transacoes, TipoTransacao.INCOME);
        BigDecimal expense = totalByType(transacoes, TipoTransacao.EXPENSE);

        return DashboardSummaryResponse.builder()
                .totalIncome(income)
                .totalExpense(expense)
                .balance(income.subtract(expense))
                .transactionCount((long) transacoes.size())
                .byCategory(byCategory(transacoes))
                .byMonth(byMonth(transacoes))
                .build();
    }

    private List<CategorySummaryDto> byCategory(List<Transacao> transacoes) {
        Map<Long, CategorySummaryDto> summaries = new LinkedHashMap<>();
        for (Transacao transacao : transacoes) {
            Categoria categoria = transacao.getCategoria();
            if (categoria == null) {
                continue;
            }
            CategorySummaryDto summary = summaries.computeIfAbsent(categoria.getId(), id ->
                    CategorySummaryDto.builder()
                            .categoryId(categoria.getId())
                            .categoryName(categoria.getNome())
                            .total(BigDecimal.ZERO)
                            .build());
            summary.setTotal(summary.getTotal().add(transacao.getValor()));
        }
        return summaries.values().stream().toList();
    }

    private List<MonthlySummaryDto> byMonth(List<Transacao> transacoes) {
        Map<String, MonthlySummaryDto> summaries = new LinkedHashMap<>();
        for (Transacao transacao : transacoes) {
            String month = transacao.getData().format(MONTH_FORMAT);
            MonthlySummaryDto summary = summaries.computeIfAbsent(month, key ->
                    MonthlySummaryDto.builder()
                            .month(month)
                            .income(BigDecimal.ZERO)
                            .expense(BigDecimal.ZERO)
                            .build());
            if (transacao.getTipo() == TipoTransacao.INCOME) {
                summary.setIncome(summary.getIncome().add(transacao.getValor()));
            } else {
                summary.setExpense(summary.getExpense().add(transacao.getValor()));
            }
        }
        return summaries.values().stream().toList();
    }

    private BigDecimal totalByType(List<Transacao> transacoes, TipoTransacao type) {
        return transacoes.stream()
                .filter(transacao -> transacao.getTipo() == type)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Carteira findWalletForMember(Long walletId, Long userId) {
        Carteira carteira = carteiraRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada"));
        if (carteira.getDono().getId().equals(userId)
                || membroRepository.existsByCarteiraIdAndUsuarioId(walletId, userId)) {
            return carteira;
        }
        throw new AccessDeniedException("Você não é membro desta carteira");
    }
}