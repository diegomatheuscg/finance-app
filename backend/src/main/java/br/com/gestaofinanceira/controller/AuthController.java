package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.auth.ForgotPasswordRequest;
import br.com.gestaofinanceira.dto.auth.ForgotPasswordResponse;
import br.com.gestaofinanceira.dto.auth.LoginRequest;
import br.com.gestaofinanceira.dto.auth.LoginResponse;
import br.com.gestaofinanceira.dto.auth.MensagemResponse;
import br.com.gestaofinanceira.dto.auth.RegisterRequest;
import br.com.gestaofinanceira.dto.auth.ResetPasswordRequest;
import br.com.gestaofinanceira.dto.user.UserResponse;
import br.com.gestaofinanceira.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse created = authService.register(request);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/v1/users/me")
                .build()
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MensagemResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
