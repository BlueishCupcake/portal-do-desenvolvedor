# Portal do Desenvolvedor

Aplicação web em React + TypeScript para acompanhar, em uma única interface, os Work Items atribuídos ao desenvolvedor na Sprint atual do Azure DevOps.

## Como o projeto foi criado

Este portal nasceu como um produto interno da squad, construído de ponta a ponta no **Cursor** com o modelo **Grok 4.6**. A ideia era ter um dashboard único para a Sprint: tarefas do Azure DevOps, bugs relacionados, status no board, PRs de release e deploy em `main`, além de um Lead Mode para o time inteiro.

O fluxo de criação foi iterativo: a interface foi remontada com o design system Tamentai (`@poliedro/tamentai/web`), a integração real passou a usar a API REST do Azure DevOps por um proxy do Vite (o PAT nunca vai para o browser) e as regras de negócio — sprint, Lead Mode, colunas de PR e o pedido de criação de PR — foram refinadas conversando com o agente no Cursor. Testes com Vitest acompanharam cada mudança.

Em resumo: o código, a arquitetura e a documentação deste repositório foram produzidos no Cursor, com Grok 4.6 como modelo do agente.

## Como executar

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Integração com Azure DevOps

A UI nunca chama o Azure DevOps diretamente. Tudo passa por `AzureDevOpsService`.

O app no browser **não consegue usar o MCP do Cursor**. MCP roda no ambiente do agente/IDE. Por isso a integração real do portal usa a **API REST do Azure DevOps** através de um proxy do Vite. O PAT fica só no servidor e não entra no bundle.

### 1. Dados reais (recomendado)

No `.env`:

```env
VITE_AZURE_DEVOPS_PROVIDER=rest
VITE_AZURE_DEVOPS_ORGANIZATION=sua-org
VITE_AZURE_DEVOPS_PROJECT=seu-projeto
VITE_AZURE_DEVOPS_TEAM=seu-time
AZURE_DEVOPS_PAT=seu-pat
```

Crie o PAT em Azure DevOps → User settings → Personal access tokens, com leitura de Work Items e Project/Team. Sem o prefixo `VITE_`, o token não é exposto ao client.

Reinicie o `pnpm dev`. O Dashboard deve carregar:

```text
Usuário autenticado pelo PAT
      ↓
Sprint atual do time
      ↓
Work Items atribuídos a você (@Me)
      ↓
Dashboard
```

### 2. Demonstração

```env
VITE_AZURE_DEVOPS_PROVIDER=mock
```

Mostra tarefas de exemplo e um aviso no Dashboard.

### 3. MCP

`VITE_AZURE_DEVOPS_PROVIDER=mcp` continua disponível se o ambiente expor um transporte HTTP. Os nomes das tools são configuráveis. Isso não substitui o REST para o app web local.

## Scripts

```bash
pnpm dev
pnpm test
pnpm test:run
pnpm test:coverage
pnpm lint
pnpm format
pnpm build
```
