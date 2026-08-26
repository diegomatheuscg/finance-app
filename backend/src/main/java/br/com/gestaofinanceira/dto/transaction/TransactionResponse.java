package br.com.gestaofinanceira.dto.transaction;

import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {

    private Long id;
    private Long walletId;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private String categoryIcon;
    private Long createdById;
    private String createdByName;
    private TipoTransacao type;
    private BigDecimal amount;
    private String description;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
