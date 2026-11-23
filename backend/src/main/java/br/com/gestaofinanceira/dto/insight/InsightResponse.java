package br.com.gestaofinanceira.dto.insight;

import java.util.List;

public record InsightResponse(String resumo, List<String> observacoes, List<String> sugestoes) {
}
