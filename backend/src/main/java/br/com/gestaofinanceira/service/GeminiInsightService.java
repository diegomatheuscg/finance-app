package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.dashboard.DashboardSummaryResponse;
import br.com.gestaofinanceira.dto.insight.InsightResponse;
import br.com.gestaofinanceira.exception.BusinessException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiInsightService {

    private static final String SYSTEM_INSTRUCTION = """
            Analise os dados financeiros agregados e responda em português brasileiro.
            Não invente informações nem recomende investimentos, crédito ou decisões fiscais.
            Gere observações baseadas somente nos dados recebidos e sugestões gerais de organização financeira.
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiInsightService(
            RestClient geminiRestClient,
            ObjectMapper objectMapper,
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.model:gemini-3.5-flash-lite}") String model) {
        this.restClient = geminiRestClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    public InsightResponse generate(
            String walletName,
            LocalDate startDate,
            LocalDate endDate,
            DashboardSummaryResponse summary) {
        if (apiKey.isBlank()) {
            throw new BusinessException("Análise com IA indisponível: configure GEMINI_API_KEY no backend.");
        }

        Map<String, Object> request = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))),
                "contents", List.of(Map.of("parts", List.of(Map.of(
                        "text", buildPrompt(walletName, startDate, endDate, summary))))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseJsonSchema", responseSchema()));

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw new BusinessException(
                    "O serviço de IA retornou erro HTTP " + exception.getStatusCode().value()
                            + ". Confira a chave e o modelo configurado.");
        } catch (ResourceAccessException exception) {
            throw new BusinessException("O serviço de IA demorou para responder. Tente novamente.");
        }

        return parseResponse(response);
    }

    private String buildPrompt(
            String walletName,
            LocalDate startDate,
            LocalDate endDate,
            DashboardSummaryResponse summary) {
        String categories = summary.getByCategory().stream()
                .map(item -> item.getCategoryName() + ": " + item.getTotal().toPlainString())
                .collect(Collectors.joining("; "));
        String months = summary.getByMonth().stream()
                .map(item -> item.getMonth() + ": receitas " + item.getIncome().toPlainString()
                        + ", despesas " + item.getExpense().toPlainString())
                .collect(Collectors.joining("; "));

        return "Carteira: " + walletName
                + "\nPeríodo: " + startDate + " a " + endDate
                + "\nValores em reais."
                + "\nReceitas: " + summary.getTotalIncome().toPlainString()
                + "\nDespesas: " + summary.getTotalExpense().toPlainString()
                + "\nSaldo: " + summary.getBalance().toPlainString()
                + "\nCategorias: " + (categories.isBlank() ? "nenhuma" : categories)
                + "\nMeses: " + (months.isBlank() ? "nenhum" : months);
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> stringField = Map.of("type", "string");
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "resumo", stringField,
                        "observacoes", Map.of("type", "array", "items", stringField),
                        "sugestoes", Map.of("type", "array", "items", stringField)),
                "required", List.of("resumo", "observacoes", "sugestoes"));
    }

    private InsightResponse parseResponse(JsonNode response) {
        JsonNode text = response == null
                ? null
                : response.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (text == null || !text.isTextual()) {
            throw new BusinessException("O serviço de IA não retornou uma análise válida.");
        }

        try {
            InsightResponse insight = objectMapper.readValue(text.asText(), InsightResponse.class);
            if (insight == null || insight.resumo() == null || insight.resumo().isBlank()
                    || insight.observacoes() == null || insight.sugestoes() == null) {
                throw new BusinessException("O serviço de IA retornou uma análise incompleta.");
            }
            return insight;
        } catch (JsonProcessingException exception) {
            throw new BusinessException("O serviço de IA retornou uma análise inválida.");
        }
    }
}
