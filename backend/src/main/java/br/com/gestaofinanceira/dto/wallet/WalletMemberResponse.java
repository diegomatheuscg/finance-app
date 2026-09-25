package br.com.gestaofinanceira.dto.wallet;

import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletMemberResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private PapelCarteira role;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime joinedAt;
}
