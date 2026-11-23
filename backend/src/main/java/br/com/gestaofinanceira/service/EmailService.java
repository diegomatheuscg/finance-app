package br.com.gestaofinanceira.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String sender;
    private final String frontendBaseUrl;
    private final boolean enabled;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String sender,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl,
            @Value("${app.mail.enabled:false}") boolean enabled) {
        this.mailSender = mailSender;
        this.sender = sender;
        this.frontendBaseUrl = frontendBaseUrl;
        this.enabled = enabled;
    }

    public void sendWelcomeEmail(String recipient, String name) {
        sendHtml(
                recipient,
                "Bem-vindo ao Finance App",
                "<p>Olá, " + escape(name) + ".</p>"
                        + "<p>Sua conta foi criada com sucesso.</p>"
                        + "<p><a href=\"" + escape(frontendBaseUrl) + "/dashboard\">Acessar o Finance App</a></p>");
    }

    public void sendPasswordResetEmail(String recipient, String name, String token) {
        String resetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/redefinir-senha/{token}")
                .buildAndExpand(token)
                .encode()
                .toUriString();

        sendHtml(
                recipient,
                "Redefinição de senha",
                "<p>Olá, " + escape(name) + ".</p>"
                        + "<p>Use o link abaixo para redefinir sua senha:</p>"
                        + "<p><a href=\"" + escape(resetUrl) + "\">Redefinir senha</a></p>"
                        + "<p>Se você não solicitou esta alteração, ignore este e-mail.</p>");
    }

    public void sendWalletMemberEmail(
            String recipient,
            String name,
            String walletName,
            String role,
            String ownerName) {
        sendHtml(
                recipient,
                "Você foi adicionado a uma carteira",
                "<p>Olá, " + escape(name) + ".</p>"
                        + "<p>" + escape(ownerName) + " adicionou você à carteira "
                        + escape(walletName) + " com o papel " + escape(role) + ".</p>"
                        + "<p><a href=\"" + escape(frontendBaseUrl) + "/dashboard\">Acessar o Finance App</a></p>");
    }

    private void sendHtml(String recipient, String subject, String html) {
        if (!enabled) {
            LOGGER.info("Envio de e-mail desabilitado. Assunto: {}", subject);
            return;
        }
        if (sender == null || sender.isBlank()) {
            LOGGER.warn("E-mail não enviado: remetente não configurado.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());
            helper.setFrom(sender);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MailException | MessagingException exception) {
            LOGGER.error("Falha ao enviar e-mail com o assunto '{}'", subject, exception);
        }
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
