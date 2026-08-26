package br.com.gestaofinanceira.dto.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampoErro {
    private String campo;
    private String mensagem;
}
