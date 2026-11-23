package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.dashboard.DashboardSummaryResponse;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.Transacao;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.TransacaoRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int MAX_LINE_LENGTH = 92;
    private static final int LINES_PER_PAGE = 48;

    private final DashboardService dashboardService;
    private final CarteiraRepository carteiraRepository;
    private final TransacaoRepository transacaoRepository;

    public ReportService(
            DashboardService dashboardService,
            CarteiraRepository carteiraRepository,
            TransacaoRepository transacaoRepository) {
        this.dashboardService = dashboardService;
        this.carteiraRepository = carteiraRepository;
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateWalletReport(
            Long userId, Long walletId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate == null ? LocalDate.now().withDayOfMonth(1) : startDate;
        LocalDate end = endDate == null ? LocalDate.now() : endDate;
        DashboardSummaryResponse summary = dashboardService.summary(userId, walletId, start, end);
        Carteira wallet = carteiraRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada"));
        List<Transacao> transactions = new ArrayList<>(
                transacaoRepository.findByCarteiraIdAndDataBetween(walletId, start, end));
        transactions.sort(Comparator.comparing(Transacao::getData).reversed());

        List<String> lines = new ArrayList<>();
        addWrappedLines(lines, "Relatorio financeiro");
        addWrappedLines(lines, "Carteira: " + wallet.getNome());
        addWrappedLines(lines, "Periodo: " + formatDate(start) + " a " + formatDate(end));
        addWrappedLines(lines, "Gerado em: " + DATE_TIME_FORMAT.format(LocalDateTime.now()));
        lines.add("");

        addWrappedLines(lines, "Resumo");
        addWrappedLines(lines, "Receitas: " + formatCurrency(summary.getTotalIncome()));
        addWrappedLines(lines, "Despesas: " + formatCurrency(summary.getTotalExpense()));
        addWrappedLines(lines, "Saldo: " + formatCurrency(summary.getBalance()));
        addWrappedLines(lines, "Lancamentos: " + summary.getTransactionCount());
        lines.add("");

        addWrappedLines(lines, "Totais por categoria");
        if (summary.getByCategory().isEmpty()) {
            addWrappedLines(lines, "Nenhum lancamento categorizado no periodo.");
        } else {
            summary.getByCategory().forEach(category ->
                    addWrappedLines(lines, category.getCategoryName() + ": " + formatCurrency(category.getTotal())));
        }
        lines.add("");

        addWrappedLines(lines, "Lancamentos do periodo");
        if (transactions.isEmpty()) {
            addWrappedLines(lines, "Nenhum lancamento no periodo.");
        } else {
            for (Transacao transaction : transactions) {
                String type = transaction.getTipo() == TipoTransacao.INCOME ? "Receita" : "Despesa";
                String category = transaction.getCategoria() == null
                        ? "Sem categoria"
                        : transaction.getCategoria().getNome();
                addWrappedLines(lines, formatDate(transaction.getData()) + " | " + type
                        + " | " + category + " | " + formatCurrency(transaction.getValor()));
                addWrappedLines(lines, "Descricao: "
                        + (transaction.getDescricao() == null ? "Sem descricao" : transaction.getDescricao()));
            }
        }

        return createPdf(lines);
    }

    private byte[] createPdf(List<String> lines) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            for (int start = 0; start < lines.size(); start += LINES_PER_PAGE) {
                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(font, 10);
                    content.newLineAtOffset(45, page.getMediaBox().getHeight() - 45);
                    int end = Math.min(start + LINES_PER_PAGE, lines.size());
                    for (int index = start; index < end; index++) {
                        content.showText(lines.get(index));
                        content.newLineAtOffset(0, -15);
                    }
                    content.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível gerar o relatório PDF", exception);
        }
    }

    private void addWrappedLines(List<String> lines, String text) {
        String remaining = toPdfText(text).replaceAll("\\s+", " ").trim();
        while (remaining.length() > MAX_LINE_LENGTH) {
            int breakAt = remaining.lastIndexOf(' ', MAX_LINE_LENGTH);
            if (breakAt <= 0) {
                breakAt = MAX_LINE_LENGTH;
            }
            lines.add(remaining.substring(0, breakAt));
            remaining = remaining.substring(breakAt).trim();
        }
        lines.add(remaining);
    }

    private String toPdfText(String text) {
        return text.replaceAll("[^\\x20-\\x7E\\u00A0-\\u00FF]", "?");
    }

    private String formatDate(LocalDate date) {
        return DATE_FORMAT.format(date);
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
        return formatter.format(amount).replace('\u00A0', ' ');
    }
}
