package br.com.gestaofinanceira.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "O formato do e-mail é inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String password;
}
