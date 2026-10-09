package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.auth.MensagemResponse;
import br.com.gestaofinanceira.dto.user.PasswordUpdateRequest;
import br.com.gestaofinanceira.dto.user.UserResponse;
import br.com.gestaofinanceira.dto.user.UserUpdateRequest;
import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(userService.getMe(user.userId()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateMe(user.userId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<MensagemResponse> updatePassword(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody PasswordUpdateRequest request) {
        return ResponseEntity.ok(userService.updatePassword(user.userId(), request));
    }
}
