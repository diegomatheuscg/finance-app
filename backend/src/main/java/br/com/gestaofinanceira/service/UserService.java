package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.auth.MensagemResponse;
import br.com.gestaofinanceira.dto.user.PasswordUpdateRequest;
import br.com.gestaofinanceira.dto.user.UserResponse;
import br.com.gestaofinanceira.dto.user.UserUpdateRequest;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.exception.BusinessException;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse getMe(Long userId) {
        return toResponse(findUser(userId));
    }

    @Transactional
    public UserResponse updateMe(Long userId, UserUpdateRequest request) {
        Usuario usuario = findUser(userId);
        usuario.setNome(request.getName().trim());
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public MensagemResponse updatePassword(Long userId, PasswordUpdateRequest request) {
        Usuario usuario = findUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), usuario.getSenhaCriptografada())) {
            throw new BusinessException("A senha atual está incorreta");
        }
        if (passwordEncoder.matches(request.getNewPassword(), usuario.getSenhaCriptografada())) {
            throw new BusinessException("A nova senha deve ser diferente da senha atual");
        }

        usuario.setSenhaCriptografada(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(usuario);
        return new MensagemResponse("Senha alterada com sucesso");
    }

    private Usuario findUser(Long userId) {
        return usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));
    }

    private UserResponse toResponse(Usuario usuario) {
        return UserResponse.builder()
                .id(usuario.getId())
                .name(usuario.getNome())
                .email(usuario.getEmail())
                .createdAt(usuario.getCriadoEm())
                .build();
    }
}
