package br.com.gestaofinanceira.dto.category;

import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "O nome da categoria é obrigatório")
    @Size(max = 80, message = "O nome da categoria deve ter no máximo 80 caracteres")
    private String name;

    @NotNull(message = "O tipo da categoria é obrigatório (RECEITA ou DESPESA)")
    private TipoTransacao type;

    private String color;

    private String icon;
}
