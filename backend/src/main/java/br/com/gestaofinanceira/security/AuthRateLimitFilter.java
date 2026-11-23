package br.com.gestaofinanceira.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000;
    private static final int MAX_REQUESTS = 10;
    private static final Set<String> LIMITED_PATHS = Set.of(
            "/auth/login",
            "/auth/register",
            "/auth/forgot-password");

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanup = new AtomicLong();
    private final SecurityErrorResponseWriter errorResponseWriter;
    private final Clock clock;

    @Autowired
    public AuthRateLimitFilter(SecurityErrorResponseWriter errorResponseWriter) {
        this(errorResponseWriter, Clock.systemUTC());
    }

    AuthRateLimitFilter(SecurityErrorResponseWriter errorResponseWriter, Clock clock) {
        this.errorResponseWriter = errorResponseWriter;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !LIMITED_PATHS.contains(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        long now = clock.millis();
        cleanupExpiredWindows(now);

        String clientIp = request.getRemoteAddr();
        Window window = windows.compute(clientIp, (ip, current) -> {
            if (current == null || now >= current.startedAtMillis() + WINDOW_MILLIS) {
                return new Window(now, 1);
            }
            return new Window(current.startedAtMillis(), current.requestCount() + 1);
        });

        if (window.requestCount() > MAX_REQUESTS) {
            long remainingMillis = window.startedAtMillis() + WINDOW_MILLIS - now;
            long retryAfterSeconds = Math.max(1, (remainingMillis + 999) / 1000);
            response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
            errorResponseWriter.write(
                    response,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas tentativas. Aguarde antes de tentar novamente.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void cleanupExpiredWindows(long now) {
        long previousCleanup = lastCleanup.get();
        if (now - previousCleanup < WINDOW_MILLIS
                || !lastCleanup.compareAndSet(previousCleanup, now)) {
            return;
        }

        windows.forEach((ip, window) -> {
            if (now >= window.startedAtMillis() + WINDOW_MILLIS) {
                windows.remove(ip, window);
            }
        });
    }

    private record Window(long startedAtMillis, int requestCount) {
    }
}
