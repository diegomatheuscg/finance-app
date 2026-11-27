package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.wallet.CreateWalletRequest;
import br.com.gestaofinanceira.dto.wallet.WalletMemberRequest;
import br.com.gestaofinanceira.dto.wallet.WalletMemberResponse;
import br.com.gestaofinanceira.dto.wallet.UpdateMemberRoleRequest;
import br.com.gestaofinanceira.dto.wallet.WalletRequest;
import br.com.gestaofinanceira.dto.wallet.WalletResponse;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.CarteiraMembro;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import br.com.gestaofinanceira.exception.BusinessException;
import br.com.gestaofinanceira.exception.ConflictException;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraMembroRepository;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class WalletService {

    private final CarteiraRepository carteiraRepository;
    private final CarteiraMembroRepository membroRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    public WalletService(
            CarteiraRepository carteiraRepository,
            CarteiraMembroRepository membroRepository,
            UsuarioRepository usuarioRepository,
            EmailService emailService) {
        this.carteiraRepository = carteiraRepository;
        this.membroRepository = membroRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
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
    public WalletResponse create(Long userId, CreateWalletRequest request) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));
        List<InitialMember> initialMembers = resolveInitialMembers(userId, request.getMembers());

        Carteira carteira = Carteira.builder()
                .dono(usuario)
                .nome(request.getName().trim())
                .descricao(normalizeOptional(request.getDescription()))
                .build();

        Carteira savedWallet = carteiraRepository.save(carteira);
        List<CarteiraMembro> savedMembers = initialMembers.stream()
                .map(initialMember -> CarteiraMembro.builder()
                        .carteira(savedWallet)
                        .usuario(initialMember.usuario())
                        .papel(initialMember.role())
                        .build())
                .toList();
        membroRepository.saveAll(savedMembers);
        savedMembers.forEach(member -> emailService.sendWalletMemberEmail(
                member.getUsuario().getEmail(),
                member.getUsuario().getNome(),
                savedWallet.getNome(),
                member.getPapel().name(),
                usuario.getNome()));

        return toResponse(savedWallet, userId);
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

    public List<WalletMemberResponse> listMembers(Long userId, Long walletId) {
        Carteira carteira = findWalletForMember(walletId, userId);
        List<WalletMemberResponse> members = new ArrayList<>();
        members.add(WalletMemberResponse.builder()
                .id(null)
                .userId(carteira.getDono().getId())
                .name(carteira.getDono().getNome())
                .email(carteira.getDono().getEmail())
                .role(PapelCarteira.OWNER)
                .joinedAt(carteira.getCriadoEm())
                .build());
        members.addAll(membroRepository.findByCarteiraId(walletId)
                .stream()
                .map(this::toMemberResponse)
                .toList());
        return members;
    }

    @Transactional
    public WalletMemberResponse addMember(Long userId, Long walletId, WalletMemberRequest request) {
        Carteira carteira = findWalletOwnedBy(walletId, userId);
        if (request.getRole() == PapelCarteira.OWNER) {
            throw new BusinessException("O papel OWNER pertence somente ao dono da carteira");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        if (carteira.getDono().getId().equals(usuario.getId())) {
            throw new ConflictException("O dono da carteira já possui acesso a ela");
        }
        if (membroRepository.existsByCarteiraIdAndUsuarioId(walletId, usuario.getId())) {
            throw new ConflictException("O usuário já é membro desta carteira");
        }

        CarteiraMembro membro = CarteiraMembro.builder()
                .carteira(carteira)
                .usuario(usuario)
                .papel(request.getRole())
                .build();
        CarteiraMembro savedMember = membroRepository.save(membro);
        emailService.sendWalletMemberEmail(
                usuario.getEmail(),
                usuario.getNome(),
                carteira.getNome(),
                membro.getPapel().name(),
                carteira.getDono().getNome());
        return toMemberResponse(savedMember);
    }

    @Transactional
    public WalletMemberResponse updateMemberRole(
            Long userId, Long walletId, Long memberUserId, UpdateMemberRoleRequest request) {
        findWalletOwnedBy(walletId, userId);
        if (request.getRole() == PapelCarteira.OWNER) {
            throw new BusinessException("O papel OWNER pertence somente ao dono da carteira");
        }

        CarteiraMembro membro = membroRepository.findByCarteiraIdAndUsuarioId(walletId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Membro não encontrado"));
        membro.setPapel(request.getRole());
        return toMemberResponse(membroRepository.save(membro));
    }

    @Transactional
    public void removeMember(Long userId, Long walletId, Long memberUserId) {
        findWalletOwnedBy(walletId, userId);
        CarteiraMembro membro = membroRepository.findByCarteiraIdAndUsuarioId(walletId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Membro não encontrado"));
        membroRepository.delete(membro);
    }

    @Transactional
    public void leave(Long userId, Long walletId) {
        Carteira carteira = findWallet(walletId);
        if (isOwner(carteira, userId)) {
            throw new BusinessException("O dono não pode sair da própria carteira");
        }
        CarteiraMembro membro = membroRepository.findByCarteiraIdAndUsuarioId(walletId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Você não é membro desta carteira"));
        membroRepository.delete(membro);
    }

    private Carteira findWalletForMember(Long walletId, Long userId) {
        Carteira carteira = findWallet(walletId);
        if (isOwner(carteira, userId) || membroRepository.existsByCarteiraIdAndUsuarioId(walletId, userId)) {
            return carteira;
        }
        throw new AccessDeniedException("Você não é membro desta carteira");
    }

    private List<InitialMember> resolveInitialMembers(Long ownerId, List<WalletMemberRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        Set<Long> memberIds = new HashSet<>();
        List<InitialMember> initialMembers = new ArrayList<>();
        for (WalletMemberRequest request : requests) {
            if (request.getRole() == PapelCarteira.OWNER) {
                throw new BusinessException("O papel OWNER pertence somente ao dono da carteira");
            }

            String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
            Usuario member = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
            if (member.getId().equals(ownerId)) {
                throw new ConflictException("O dono da carteira já possui acesso a ela");
            }
            if (!memberIds.add(member.getId())) {
                throw new ConflictException("O usuário já foi adicionado à lista de membros");
            }
            initialMembers.add(new InitialMember(member, request.getRole()));
        }
        return initialMembers;
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

    private WalletMemberResponse toMemberResponse(CarteiraMembro membro) {
        return WalletMemberResponse.builder()
                .id(membro.getId())
                .userId(membro.getUsuario().getId())
                .name(membro.getUsuario().getNome())
                .email(membro.getUsuario().getEmail())
                .role(membro.getPapel())
                .joinedAt(membro.getEntradoEm())
                .build();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record InitialMember(Usuario usuario, PapelCarteira role) {
    }
}