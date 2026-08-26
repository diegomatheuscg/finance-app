package br.com.gestaofinanceira.dto.category;

import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private TipoTransacao type;
    private String color;
    private String icon;
}
