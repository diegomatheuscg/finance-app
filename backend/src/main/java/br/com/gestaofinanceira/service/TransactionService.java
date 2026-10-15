package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.transaction.TransactionRequest;
import br.com.gestaofinanceira.dto.transaction.TransactionResponse;
import br.com.gestaofinanceira.entity.Carteira;
import br.com.gestaofinanceira.entity.CarteiraMembro;
import br.com.gestaofinanceira.entity.Categoria;
import br.com.gestaofinanceira.entity.Transacao;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.entity.enums.PapelCarteira;
import br.com.gestaofinanceira.exception.BusinessException;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CarteiraMembroRepository;
import br.com.gestaofinanceira.repository.CarteiraRepository;
import br.com.gestaofinanceira.repository.CategoriaRepository;
import br.com.gestaofinanceira.repository.TransacaoRepository;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class TransactionService {

    private final TransacaoRepository transacaoRepository;
    private final CarteiraRepository carteiraRepository;
    private final CarteiraMembroRepository membroRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public TransactionService(
            TransacaoRepository transacaoRepository,
            CarteiraRepository carteiraRepository,
            CarteiraMembroRepository membroRepository,
            CategoriaRepository categoriaRepository,
            UsuarioRepository usuarioRepository) {
        this.transacaoRepository = transacaoRepository;
        this.carteiraRepository = carteiraRepository;
        this.membroRepository = membroRepository;
        this.categoriaRepository = categoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Page<TransactionResponse> list(
            Long userId,
            Long walletId,
            br.com.gestaofinanceira.entity.enums.TipoTransacao type,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String sort) {
        findWalletForMember(walletId, userId);
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BusinessException("A data inicial não pode ser posterior à data final");
        }

        Specification<Transacao> specification = (root, query, builder) ->
                builder.equal(root.get("carteira").get("id"), walletId);
        if (type != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("tipo"), type));
        }
        if (categoryId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("categoria").get("id"), categoryId));
        }
        if (startDate != null) {
            specification = specification.and((root, query, builder) ->
                    builder.greaterThanOrEqualTo(root.get("data"), startDate));
        }
        if (endDate != null) {
            specification = specification.and((root, query, builder) ->
                    builder.lessThanOrEqualTo(root.get("data"), endDate));
        }

        return transacaoRepository.findAll(specification, pageable(page, size, sort))
                .map(this::toResponse);
    }

    public TransactionResponse get(Long userId, Long walletId, Long transactionId) {
        findWalletForMember(walletId, userId);
        return toResponse(findTransaction(walletId, transactionId));
    }

    @Transactional
    public TransactionResponse create(Long userId, Long walletId, TransactionRequest request) {
        Carteira carteira = findWalletForEditor(walletId, userId);
        Usuario usuario = findUser(userId);
        Categoria categoria = resolveCategory(userId, request);

        Transacao transacao = Transacao.builder()
                .carteira(carteira)
                .categoria(categoria)
                .criadoPor(usuario)
                .tipo(request.getType())
                .valor(request.getAmount())
                .descricao(normalizeOptional(request.getDescription()))
                .data(request.getDate())
                .build();
        return toResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public TransactionResponse update(
            Long userId, Long walletId, Long transactionId, TransactionRequest request) {
        findWalletForEditor(walletId, userId);
        Transacao transacao = findTransaction(walletId, transactionId);
        transacao.setCategoria(resolveCategory(userId, request));
        transacao.setTipo(request.getType());
        transacao.setValor(request.getAmount());
        transacao.setDescricao(normalizeOptional(request.getDescription()));
        transacao.setData(request.getDate());
        return toResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public void delete(Long userId, Long walletId, Long transactionId) {
        findWalletForEditor(walletId, userId);
        transacaoRepository.delete(findTransaction(walletId, transactionId));
    }

    private Carteira findWalletForMember(Long walletId, Long userId) {
        Carteira carteira = findWallet(walletId);
        if (isOwner(carteira, userId) || membroRepository.existsByCarteiraIdAndUsuarioId(walletId, userId)) {
            return carteira;
        }
        throw new AccessDeniedException("Você não é membro desta carteira");
    }

    private Carteira findWalletForEditor(Long walletId, Long userId) {
        Carteira carteira = findWalletForMember(walletId, userId);
        if (isOwner(carteira, userId)) {
            return carteira;
        }
        CarteiraMembro membro = membroRepository.findByCarteiraIdAndUsuarioId(walletId, userId)
                .orElseThrow(() -> new AccessDeniedException("Você não é membro desta carteira"));
        if (membro.getPapel() != PapelCarteira.EDITOR) {
            throw new AccessDeniedException("Somente OWNER ou EDITOR podem alterar transações");
        }
        return carteira;
    }

    private Carteira findWallet(Long walletId) {
        return carteiraRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Carteira não encontrada"));
    }

    private Transacao findTransaction(Long walletId, Long transactionId) {
        return transacaoRepository.findByIdAndCarteiraId(transactionId, walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));
    }

    private Usuario findUser(Long userId) {
        return usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));
    }

    private Categoria resolveCategory(Long userId, TransactionRequest request) {
        if (request.getCategoryId() == null) {
            return null;
        }
        Categoria categoria = categoriaRepository.findByIdAndUsuarioId(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (categoria.getTipo() != request.getType()) {
            throw new BusinessException("A categoria deve ter o mesmo tipo da transação");
        }
        return categoria;
    }

    private Pageable pageable(int page, int size, String sort) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BusinessException("A paginação deve usar page >= 0 e size entre 1 e 100");
        }
        String[] parts = (sort == null || sort.isBlank() ? "date,desc" : sort).split(",", 2);
        String property = switch (parts[0]) {
            case "date" -> "data";
            case "amount" -> "valor";
            case "createdAt" -> "criadoEm";
            default -> throw new BusinessException("Ordenação inválida");
        };
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }

    private TransactionResponse toResponse(Transacao transacao) {
        Categoria categoria = transacao.getCategoria();
        return TransactionResponse.builder()
                .id(transacao.getId())
                .walletId(transacao.getCarteira().getId())
                .categoryId(categoria == null ? null : categoria.getId())
                .categoryName(categoria == null ? null : categoria.getNome())
                .categoryColor(categoria == null ? null : categoria.getCor())
                .categoryIcon(categoria == null ? null : categoria.getIcone())
                .createdById(transacao.getCriadoPor().getId())
                .createdByName(transacao.getCriadoPor().getNome())
                .type(transacao.getTipo())
                .amount(transacao.getValor())
                .description(transacao.getDescricao())
                .date(transacao.getData())
                .createdAt(transacao.getCriadoEm())
                .build();
    }

    private boolean isOwner(Carteira carteira, Long userId) {
        return carteira.getDono().getId().equals(userId);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}