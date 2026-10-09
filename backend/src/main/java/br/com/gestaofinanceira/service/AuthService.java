package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.auth.ForgotPasswordResponse;
import br.com.gestaofinanceira.dto.auth.LoginRequest;
import br.com.gestaofinanceira.dto.auth.LoginResponse;
import br.com.gestaofinanceira.dto.auth.MensagemResponse;
import br.com.gestaofinanceira.dto.auth.RegisterRequest;
import br.com.gestaofinanceira.dto.auth.ResetPasswordRequest;
import br.com.gestaofinanceira.dto.user.UserResponse;
import br.com.gestaofinanceira.entity.Categoria;
import br.com.gestaofinanceira.entity.TokenRedefinicaoSenha;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.exception.BusinessException;
import br.com.gestaofinanceira.exception.ConflictException;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.exception.UnauthenticatedException;
import br.com.gestaofinanceira.repository.CategoriaRepository;
import br.com.gestaofinanceira.repository.TokenRedefinicaoSenhaRepository;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import br.com.gestaofinanceira.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private static final String GENERIC_RESET_MESSAGE =
            "If the account exists, password reset instructions will be sent.";

    private static final List<DefaultCategory> DEFAULT_CATEGORIES = List.of(
            new DefaultCategory("Salary", TipoTransacao.INCOME, "#16A34A", "wallet"),
            new DefaultCategory("Other income", TipoTransacao.INCOME, "#22C55E", "plus"),
            new DefaultCategory("Food", TipoTransacao.EXPENSE, "#F97316", "utensils"),
            new DefaultCategory("Transport", TipoTransacao.EXPENSE, "#3B82F6", "car"),
            new DefaultCategory("Housing", TipoTransacao.EXPENSE, "#8B5CF6", "home"),
            new DefaultCategory("Health", TipoTransacao.EXPENSE, "#EF4444", "heart"));

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final TokenRedefinicaoSenhaRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final boolean exposeResetDebugToken;

    public AuthService(
            UsuarioRepository usuarioRepository,
            CategoriaRepository categoriaRepository,
            TokenRedefinicaoSenhaRepository resetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            @Value("${app.password-reset.expose-debug-token:false}") boolean exposeResetDebugToken) {
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.exposeResetDebugToken = exposeResetDebugToken;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (usuarioRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        Usuario novoUsuario = Usuario.builder()
                .nome(request.getName().trim())
                .email(email)
                .senhaCriptografada(passwordEncoder.encode(request.getPassword()))
                .build();

        Usuario usuario;
        try {
            usuario = usuarioRepository.saveAndFlush(novoUsuario);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("An account with this email already exists");
        }

        List<Categoria> categoriasPadrao = DEFAULT_CATEGORIES.stream()
                .map(defaultCategory -> Categoria.builder()
                        .usuario(usuario)
                        .nome(defaultCategory.name())
                        .tipo(defaultCategory.type())
                        .cor(defaultCategory.color())
                        .icone(defaultCategory.icon())
                        .build())
                .toList();
        categoriaRepository.saveAll(categoriasPadrao);

        return toUserResponse(usuario);
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthenticatedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getSenhaCriptografada())) {
            throw new UnauthenticatedException("Invalid email or password");
        }

        return LoginResponse.builder()
                .accessToken(jwtTokenProvider.generateToken(usuario.getId(), usuario.getEmail()))
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMillis() / 1000)
                .build();
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String requestEmail) {
        String tokenValue = UUID.randomUUID().toString();
        usuarioRepository.findByEmail(normalizeEmail(requestEmail)).ifPresent(usuario -> {
            resetTokenRepository.deleteByUsuarioId(usuario.getId());
            TokenRedefinicaoSenha resetToken = TokenRedefinicaoSenha.builder()
                    .usuario(usuario)
                    .token(tokenValue)
                    .expiraEm(LocalDateTime.now().plusHours(1))
                    .utilizado(false)
                    .build();
            resetTokenRepository.save(resetToken);
        });

        return ForgotPasswordResponse.builder()
                .message(GENERIC_RESET_MESSAGE)
                .debugToken(exposeResetDebugToken ? tokenValue : null)
                .build();
    }

    @Transactional
    public MensagemResponse resetPassword(ResetPasswordRequest request) {
        TokenRedefinicaoSenha resetToken = resetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("Password reset token is invalid or expired"));

        if (resetToken.isUtilizado() || !resetToken.getExpiraEm().isAfter(LocalDateTime.now())) {
            throw new BusinessException("Password reset token is invalid or expired");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setSenhaCriptografada(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(usuario);
        resetToken.setUtilizado(true);
        resetTokenRepository.save(resetToken);

        return new MensagemResponse("Password has been reset successfully");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private UserResponse toUserResponse(Usuario usuario) {
        return UserResponse.builder()
                .id(usuario.getId())
                .name(usuario.getNome())
                .email(usuario.getEmail())
                .createdAt(usuario.getCriadoEm())
                .build();
    }

    private record DefaultCategory(String name, TipoTransacao type, String color, String icon) {
    }
}
