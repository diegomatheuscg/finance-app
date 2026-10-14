package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.wallet.WalletRequest;
import br.com.gestaofinanceira.dto.wallet.WalletResponse;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.CarteiraMembro;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraMembroRepository;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class WalletService {

    private final CarteiraRepository carteiraRepository;
    private final CarteiraMembroRepository membroRepository;
    private final UsuarioRepository usuarioRepository;

    public WalletService(
            CarteiraRepository carteiraRepository,
            CarteiraMembroRepository membroRepository,
            UsuarioRepository usuarioRepository) {
        this.carteiraRepository = carteiraRepository;
        this.membroRepository = membroRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<WalletResponse> list(Long userId) {
        return carteiraRepository.findAllByUsuarioDonoOrMembro(userId)
                .stream()
                .map(wallet -> toResponse(wallet, userId))
                .toList();
    }

    public WalletResponse get(Long userId, Long walletId) {
        Carteira carteira = findWalletForMember(walletId, userId);
        return toResponse(carteira, userId);
    }

    @Transactional
    public WalletResponse create(Long userId, WalletRequest request) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));

        Carteira carteira = Carteira.builder()
                .dono(usuario)
                .nome(request.getName().trim())
                .descricao(normalizeOptional(request.getDescription()))
                .build();

        return toResponse(carteiraRepository.save(carteira), userId);
    }

    @Transactional
    public WalletResponse update(Long userId, Long walletId, WalletRequest request) {
        Carteira carteira = findWalletOwnedBy(walletId, userId);
        carteira.setNome(request.getName().trim());
        carteira.setDescricao(normalizeOptional(request.getDescription()));
        return toResponse(carteiraRepository.save(carteira), userId);
    }

    @Transactional
    public void delete(Long userId, Long walletId) {
        carteiraRepository.delete(findWalletOwnedBy(walletId, userId));
    }

    private Carteira findWalletForMember(Long walletId, Long userId) {
        Carteira carteira = findWallet(walletId);
        if (isOwner(carteira, userId) || membroRepository.existsByCarteiraIdAndUsuarioId(walletId, userId)) {
            return carteira;
        }
        throw new AccessDeniedException("Você não é membro desta carteira");
    }

    private Carteira findWalletOwnedBy(Long walletId, Long userId) {
        Carteira carteira = findWallet(walletId);
        if (!isOwner(carteira, userId)) {
            throw new AccessDeniedException("Somente o dono pode alterar esta carteira");
        }
        return carteira;
    }

    private Carteira findWallet(Long walletId) {
        return carteiraRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada"));
    }

    private boolean isOwner(Carteira carteira, Long userId) {
        return carteira.getDono().getId().equals(userId);
    }

    private WalletResponse toResponse(Carteira carteira, Long userId) {
        PapelCarteira role = isOwner(carteira, userId)
                ? PapelCarteira.OWNER
                : membroRepository.findByCarteiraIdAndUsuarioId(carteira.getId(), userId)
                        .map(CarteiraMembro::getPapel)
                        .orElse(null);

        return WalletResponse.builder()
                .id(carteira.getId())
                .name(carteira.getNome())
                .description(carteira.getDescricao())
                .ownerId(carteira.getDono().getId())
                .ownerName(carteira.getDono().getNome())
                .userRole(role)
                .createdAt(carteira.getCriadoEm())
                .build();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}