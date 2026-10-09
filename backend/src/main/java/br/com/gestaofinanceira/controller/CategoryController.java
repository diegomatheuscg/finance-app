package br.com.gestaofinanceira.controller;

import br.com.gestaofinanceira.dto.category.CategoryRequest;
import br.com.gestaofinanceira.dto.category.CategoryResponse;
import br.com.gestaofinanceira.entity.enums.TipoTransacao;
import br.com.gestaofinanceira.security.AuthenticatedUser;
import br.com.gestaofinanceira.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) TipoTransacao type) {
        return ResponseEntity.ok(categoryService.list(user.userId(), type));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse created = categoryService.create(user.userId(), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(user.userId(), categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId) {
        categoryService.delete(user.userId(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
