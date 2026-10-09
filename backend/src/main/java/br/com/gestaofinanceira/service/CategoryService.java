package br.com.gestaofinanceira.service;

import br.com.gestaofinanceira.dto.category.CategoryRequest;
import br.com.gestaofinanceira.dto.category.CategoryResponse;
import br.com.gestaofinanceira.entity.Categoria;
import br.com.gestaofinanceira.entity.Usuario;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.exception.BusinessException;
import br.com.gestaofinanceira.exception.ResourceNotFoundException;
import br.com.gestaofinanceira.repository.CategoriaRepository;
import br.com.gestaofinanceira.repository.TransacaoRepository;
import br.com.gestaofinanceira.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TransacaoRepository transacaoRepository;

    public CategoryService(
            CategoriaRepository categoriaRepository,
            UsuarioRepository usuarioRepository,
            TransacaoRepository transacaoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.usuarioRepository = usuarioRepository;
        this.transacaoRepository = transacaoRepository;
    }

    public List<CategoryResponse> list(Long userId, TipoTransacao type) {
        List<Categoria> categorias = type == null
                ? categoriaRepository.findByUsuarioId(userId)
                : categoriaRepository.findByUsuarioIdAndTipo(userId, type);
        return categorias.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));

        Categoria categoria = Categoria.builder()
                .usuario(usuario)
                .nome(request.getName().trim())
                .tipo(request.getType())
                .cor(normalizeOptional(request.getColor()))
                .icone(normalizeOptional(request.getIcon()))
                .build();

        return toResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Categoria categoria = findOwnedCategory(userId, categoryId);
        categoria.setNome(request.getName().trim());
        categoria.setTipo(request.getType());
        categoria.setCor(normalizeOptional(request.getColor()));
        categoria.setIcone(normalizeOptional(request.getIcon()));
        return toResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        Categoria categoria = findOwnedCategory(userId, categoryId);
        if (transacaoRepository.existsByCategoriaId(categoryId)) {
            throw new BusinessException("Não é possível excluir uma categoria vinculada a transações");
        }
        categoriaRepository.delete(categoria);
    }

    private Categoria findOwnedCategory(Long userId, Long categoryId) {
        return categoriaRepository.findByIdAndUsuarioId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
    }

    private CategoryResponse toResponse(Categoria categoria) {
        return CategoryResponse.builder()
                .id(categoria.getId())
                .name(categoria.getNome())
                .type(categoria.getTipo())
                .color(categoria.getCor())
                .icon(categoria.getIcone())
                .build();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
