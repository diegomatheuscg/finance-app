package br.com.gestaofinanceira.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private Long transactionCount;

    @Builder.Default
    private List<CategorySummaryDto> byCategory = new ArrayList<>();

    @Builder.Default
    private List<MonthlySummaryDto> byMonth = new ArrayList<>();
}
