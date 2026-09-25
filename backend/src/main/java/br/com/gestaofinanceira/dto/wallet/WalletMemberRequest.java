package br.com.gestaofinanceira.dto.wallet;

import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletMemberRequest {

    @NotBlank(message = "O e-mail do membro é obrigatório")
    @Email(message = "O formato do e-mail é inválido")
    private String email;

    @NotNull(message = "O papel do membro é obrigatório (DONO, EDITOR ou VISUALIZADOR)")
    private PapelCarteira role;
}
