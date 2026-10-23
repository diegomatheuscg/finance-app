# Fluxo — frontend

Frontend do sistema de gestão financeira, feito com React, Vite, Tailwind CSS 4 e componentes reutilizáveis no padrão shadcn/ui.

## Executar localmente

1. Instale o Node.js 20.19+ ou 22.12+.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie a API Spring Boot na porta `8080` ou defina `VITE_API_BASE_URL` em um arquivo `.env.local`.
4. Inicie o frontend:

   ```bash
   npm run dev
   ```

O Vite inicia normalmente em `http://localhost:5173`. Para verificar o código e gerar o build:

```bash
npm run lint
npm run build
```

## Fluxos implementados

- Login e cadastro integrados à API, com validação dos campos, visibilidade da senha, estado de envio e retorno de erros.
- Persistência do token JWT em `localStorage` e validação da sessão ao reabrir a aplicação.
- Rotas públicas e protegidas, logout e redirecionamento para a página solicitada após login.
- Solicitação de recuperação de senha com mensagem neutra e redefinição pela rota `/redefinir-senha/:token`.
- Área autenticada provisória; dashboard e carteiras serão conectados na próxima etapa.

Para testar a redefinição localmente, habilite `app.password-reset.expose-debug-token=true` na API; quando ela devolver o token de desenvolvimento, o frontend mostra um link de teste. Não habilite essa opção em produção.

## Organização

- `src/pages`: telas e fluxos de navegação.
- `src/components/ui`: componentes reutilizáveis baseados no padrão shadcn/ui.
- `src/components/auth`: componentes compartilhados pelas telas de acesso.
- `src/contexts` e `src/hooks`: sessão e autenticação.
- `src/lib`: integração com a API e validações.

## API

Por padrão, as chamadas são feitas para `http://localhost:8080`. Para usar outra URL, configure:

```env
VITE_API_BASE_URL=http://localhost:8080
```
