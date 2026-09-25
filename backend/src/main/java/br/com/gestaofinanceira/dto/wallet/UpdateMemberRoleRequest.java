package br.com.gestaofinanceira.dto.wallet;

import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberRoleRequest {

    @NotNull(message = "O papel do membro é obrigatório (DONO, EDITOR ou VISUALIZADOR)")
    private PapelCarteira role;
}
