package br.com.gestaofinanceira.dto.wallet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWalletRequest {

    @NotBlank(message = "O nome da carteira é obrigatório")
    @Size(min = 2, max = 100, message = "O nome da carteira deve ter entre 2 e 100 caracteres")
    private String name;

    @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
    private String description;

    @Valid
    @Builder.Default
    private List<WalletMemberRequest> members = new ArrayList<>();
}
