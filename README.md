# Ateliê · Gestão e Estoque

Aplicação local React/Vite com API Express e banco SQLite gerenciado pelo Prisma.

## Configuração

Requisitos: Node.js 20.19+ e npm.

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

O banco é criado em `dev.db` na raiz do projeto. `npm run dev` inicia a API em `http://127.0.0.1:3001` e o Vite em `http://localhost:5173`; as chamadas `/api` passam pelo proxy do Vite.

## Execução em segundo plano no macOS

Instale as dependências e inicie os processos gerenciados pelo PM2:

```bash
npm install
npm run pm2:start
npm run pm2:save
```

Para iniciar o PM2 automaticamente no login do macOS, execute `npm run pm2:startup` e siga o comando de configuração exibido no terminal (ele pode solicitar `sudo`). Depois, execute `npm run pm2:save` novamente para salvar a lista de processos. O PM2 manterá a API e o Vite ativos e reiniciará os processos se eles encerrarem; a aplicação ficará disponível em `http://localhost:5173`.

Use `npm run pm2:logs` para acompanhar os logs, `npm run pm2:restart` para reiniciar e `npm run pm2:stop` para parar os processos.

Para regenerar o cliente após mudanças no schema, use `npm run db:generate`. Para aplicar migrações futuras, use `npm run db:migrate`. `npm run db:seed` cria o usuário inicial somente quando não existe nenhum usuário; não insere dados de estoque ou vendas.

## Acesso local

O seed cria um usuário local com senha armazenada em hash. Use o e-mail e a senha definidos em `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`; altere esses valores antes da primeira execução do seed. Depois, as credenciais podem ser atualizadas pela tela Configurações.

Defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `JWT_SECRET` no `.env` antes de distribuir o ambiente. Esta autenticação foi preparada para desenvolvimento local; não exponha as credenciais de seed nem o segredo JWT em produção.

## API

- `POST /api/auth/login` e `GET /api/auth/me`
- `GET/POST /api/insumos`
- `GET/POST /api/produtos` (inclui Ficha Técnica)
- `POST /api/producao` (baixa insumos, adiciona produto e registra movimentações em transação)
- `GET/POST /api/vendas`
- `GET/POST /api/movimentacoes`
- `GET /api/health`

As rotas de dados exigem o token retornado pelo login. Registrar uma venda calcula o custo pela Ficha Técnica, reduz o estoque do produto e grava a movimentação de saída na mesma transação SQLite.
