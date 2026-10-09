package br.com.gestaofinanceira.security;

public record AuthenticatedUser(Long userId, String email) {
}
