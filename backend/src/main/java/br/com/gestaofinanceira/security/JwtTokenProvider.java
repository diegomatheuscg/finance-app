package br.com.gestaofinanceira.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMillis) {
        if (expirationMillis <= 0) {
            throw new IllegalArgumentException("JWT expiration must be greater than zero");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(Long userId, String email) {
        if (userId == null || email == null || email.isBlank()) {
            throw new IllegalArgumentException("User id and email are required to generate a JWT");
        }

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusMillis(expirationMillis);

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", email)
                .setIssuedAt(Date.from(issuedAt))
                .setExpiration(Date.from(expiresAt))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public AuthenticatedUser parseToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Long userId;
        try {
            userId = Long.valueOf(claims.getSubject());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("JWT subject must contain a numeric user id", ex);
        }

        String email = claims.get("email", String.class);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("JWT email claim is required");
        }

        return new AuthenticatedUser(userId, email);
    }

    public long getExpirationMillis() {
        return expirationMillis;
    }
}
