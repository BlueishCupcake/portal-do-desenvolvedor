# Portal do Desenvolvedor

Aplicação React + TypeScript que reúne tarefas, Sprint, pontos, pull requests,
deploys, anotações e pipelines do Azure DevOps em uma única interface.

## Origem do projeto

O portal foi construído de ponta a ponta no **Cursor**, usando o modelo
**Grok 4.6**, e utiliza o design system Tamentai
(`@poliedro/tamentai/web`). O desenvolvimento foi iterativo e acompanhado por
testes automatizados com Vitest.

## Funcionalidades

### Tasks

- seleção de qualquer Sprint disponível para o time;
- tarefas atribuídas ao usuário autenticado pelo PAT;
- filtros por tipo, estado e coluna do Board;
- busca e ordenação;
- indicação de bugs abertos ou corrigidos;
- Story Points de cada item e total de pontos do usuário na Sprint;
- indicação de PR de release e deploy em `main`;
- detalhes do Work Item em um painel lateral;
- tema claro e escuro.

### Lead Mode

O Lead Mode carrega todos os itens da Sprint e mostra o responsável por cada
um. É possível selecionar tarefas de um único desenvolvedor e gerar uma
mensagem profissional, em português, solicitando a criação das pull requests.
A mensagem contém links para os Work Items e pode ser copiada.

### To Do's

A aba To Do's permite criar, editar e excluir post-its. Os dados ficam salvos
no `localStorage` do navegador. O indicador vermelho acima da aba mostra a
quantidade atual de post-its.

### Pipelines

A aba Pipelines mostra as 50 execuções mais recentes:

- solicitadas em nome do usuário autenticado;
- limitadas ao projeto e às definições configuradas;
- com nome, número, status, resultado, branch, horário e link para o Azure
  DevOps.

A atualização acontece a cada 30 segundos. O usuário pode ativar notificações
do navegador para receber avisos quando uma pipeline começar ou terminar.
O portal precisa permanecer aberto; notificações com o navegador fechado
exigiriam Web Push ou Service Hooks em um backend.

## Pré-requisitos

- Node.js 18 ou superior;
- pnpm;
- acesso ao Azure DevOps;
- um PAT do Azure DevOps.

## Instalação

```bash
pnpm install
cp .env.example .env
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

## Configuração do Azure DevOps

Crie um PAT em **Azure DevOps → User settings → Personal access tokens** com os
seguintes escopos:

- **Work Items (Read)**;
- **Project and Team (Read)**;
- **Build (Read)**.

Configure o arquivo `.env`:

```env
VITE_AZURE_DEVOPS_PROVIDER=rest
VITE_AZURE_DEVOPS_ORGANIZATION=sua-organizacao
VITE_AZURE_DEVOPS_PROJECT=projeto-dos-work-items
VITE_AZURE_DEVOPS_TEAM=nome-do-time

AZURE_DEVOPS_PIPELINE_PROJECT=projeto-das-pipelines
AZURE_DEVOPS_PIPELINE_DEFINITION_IDS=690,1132,848

AZURE_DEVOPS_PAT=seu-pat
```

O `.env` está no `.gitignore` e **nunca deve ser commitado**. O PAT não usa o
prefixo `VITE_`, portanto permanece no proxy do servidor e não entra no bundle
do navegador.

### Organização, projeto e time

- `VITE_AZURE_DEVOPS_ORGANIZATION`: nome da organização na URL do Azure;
- `VITE_AZURE_DEVOPS_PROJECT`: projeto que contém os Work Items;
- `VITE_AZURE_DEVOPS_TEAM`: time usado para localizar Sprints e iterações.

### Configuração das pipelines

As pipelines podem estar em um projeto diferente dos Work Items:

- `AZURE_DEVOPS_PIPELINE_PROJECT`: projeto que contém as pipelines;
- `AZURE_DEVOPS_PIPELINE_DEFINITION_IDS`: IDs separados por vírgula.

O ID pode ser obtido na URL da definição:

```text
https://dev.azure.com/organizacao/projeto/_build?definitionId=690
                                                               └─ ID
```

Se `AZURE_DEVOPS_PIPELINE_PROJECT` não for informado, o portal usa
`VITE_AZURE_DEVOPS_PROJECT`. Se a lista de IDs estiver vazia, todas as
definições do projeto podem ser consultadas.

### Identidade do usuário

O PAT é opaco e não contém o nome diretamente. O servidor usa o PAT para
autenticar nos endpoints de conexão e perfil do Azure DevOps. Nome completo,
e-mail e ID exibidos no portal correspondem ao proprietário autenticado do PAT.

## Notificações de pipelines

1. Abra a aba **Pipelines**.
2. Clique em **Ativar notificações**.
3. Autorize as notificações no navegador.
4. Mantenha o portal aberto.

Se a permissão tiver sido bloqueada, libere-a nas configurações do navegador
para o endereço do portal. A preferência de ativação é salva no
`localStorage`.

## Execução

Depois de alterar o `.env`, reinicie o servidor:

```bash
pnpm dev
```

A aplicação estará disponível no endereço exibido pelo Vite, normalmente
`http://localhost:5173`.

## Modo de demonstração

Para executar sem acessar dados reais:

```env
VITE_AZURE_DEVOPS_PROVIDER=mock
```

O portal exibirá usuários, tarefas e pipelines de exemplo.

## Integração MCP

O provider `mcp` permanece disponível para ambientes que exponham um transporte
HTTP:

```env
VITE_AZURE_DEVOPS_PROVIDER=mcp
VITE_AZURE_DEVOPS_MCP_URL=
VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_USER=
VITE_AZURE_DEVOPS_MCP_TOOL_USER_PIPELINES=
VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_SPRINT=
VITE_AZURE_DEVOPS_MCP_TOOL_SPRINTS=
VITE_AZURE_DEVOPS_MCP_TOOL_USER_WORK_ITEMS=
VITE_AZURE_DEVOPS_MCP_TOOL_WORK_ITEM_DETAILS=
```

O navegador não acessa o MCP do Cursor diretamente. Para uso local com dados
reais, a integração REST pelo proxy do Vite é a opção recomendada.

## Arquitetura da integração

```text
Interface React
      ↓
AzureDevOpsService
      ↓
Proxy do Vite (/api/azure-devops)
      ↓
API REST do Azure DevOps
```

## Scripts

```bash
pnpm dev             # servidor de desenvolvimento
pnpm build           # type-check e build de produção
pnpm test            # testes em modo watch
pnpm test:run        # todos os testes uma vez
pnpm test:coverage   # cobertura
pnpm lint            # ESLint
pnpm format          # Prettier
```
