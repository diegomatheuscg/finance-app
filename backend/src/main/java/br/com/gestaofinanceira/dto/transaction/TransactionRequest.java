package br.com.gestaofinanceira.dto.transaction;

import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {

    @NotNull(message = "O tipo da transação é obrigatório (RECEITA ou DESPESA)")
    private TipoTransacao type;

    @NotNull(message = "O valor é obrigatório")
    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
    private BigDecimal amount;

    private String description;

    @NotNull(message = "A data da transação é obrigatória")
    @PastOrPresent(message = "A data da transação não pode ser uma data futura")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;

    private Long categoryId;
}
