# FEATURES.md

Descrição técnica de como cada funcionalidade do Portal do Desenvolvedor
foi implementada. O foco é o fluxo real de código, APIs e estado — não o
texto de produto do `README.md`.

## 1. Stack e casca da aplicação

- **UI:** React 19 + TypeScript, Vite 6, CSS Modules, design system
  `@poliedro/tamentai/web`.
- **Estado remoto:** TanStack Query (`QueryClient` com `retry: 1` e
  `refetchOnWindowFocus: false`).
- **Testes:** Vitest + Testing Library + jsdom. Cobertura v8 com limiar
  de 90% (statements, branches, functions, lines). O pacote Tamentai é
  substituído por `src/test/tamentaiWebMock.tsx`.
- **Sem React Router.** As quatro áreas (Tasks, To Do's, Pipelines,
  Metrics) são um estado em memória (`WorkspaceView`).

Ponto de entrada: `src/main.tsx` monta `AppProviders` → `App` →
`Dashboard`.

### Providers (`src/app/providers`)

| Provider | Persistência | Papel |
| --- | --- | --- |
| `QueryClientProvider` | memória | cache das queries Azure |
| `ThemeProvider` | `localStorage` (`portal-theme`) | `data-theme` em `<html>` |
| `LeadModeProvider` | `localStorage` (`portal-lead-mode`) | liga/desliga Lead Mode |
| `WorkspaceViewProvider` | memória | aba ativa |
| `AzureDevOpsProvider` | — | injeta `AzureDevOpsService` |

O Dashboard lê esses contextos via hooks (`useTheme`, `useLeadMode`,
`useWorkspaceView`, `useAzureDevOpsService`) e decide o que renderizar
com `view === 'tasks' | 'todos' | 'pipelines' | 'metrics'`.

## 2. Integração Azure DevOps

### Contrato do cliente

Toda a UI fala com a interface `AzureDevOpsService`
(`src/services/azureDevOps/types.ts`):

- `getCurrentUser`, `getCurrentSprint`, `getSprints`
- `getUserWorkItems(sprintIds, userId, { leadMode })`
- `getWorkItemDetails(id)`
- `getUserPipelines`
- `getMetrics(query)`
- `createDeployCard(input)`

A fábrica `createAzureDevOpsService()` escolhe o provider por
`VITE_AZURE_DEVOPS_PROVIDER`:

| Valor | Implementação | Uso |
| --- | --- | --- |
| `mock` (padrão) | `mock/mockService.ts` | demos e testes |
| `rest` | `rest/restService.ts` | produção local |
| `mcp` | `mcp/mcpService.ts` | transporte HTTP de tools |

O provider `rest` **não chama o Azure no browser**. Ele só faz
`fetch('/api/azure-devops/...')`. O PAT nunca usa prefixo `VITE_` e
não entra no bundle.

### BFF (plugin Vite)

`server/azureDevOps/plugin.ts` registra middleware em
`configureServer` e `configurePreviewServer`. O Vite carrega `.env`
via `envFiles.ts` e encaminha `/api/azure-devops/*` para
`handleAzureDevOpsApi`.

Autenticação no servidor:

1. Lê `AZURE_DEVOPS_PAT` + org/projeto/time de
   `AZURE_DEVOPS_*` ou `VITE_AZURE_DEVOPS_*` (`config.ts`).
2. Sem org, projeto ou PAT → HTTP 503.
3. Cada request Azure usa `Authorization: Basic` com `:${pat}`
   (`client.ts`, API 7.1).
4. Identidade: `GET /_apis/connectionData` e, se disponível,
   `GET https://vssps.dev.azure.com/{org}/_apis/profile/profiles/me`.
   `@Me` nas WIQL é resolvido pelo Azure a partir desse PAT.

Time: `VITE_AZURE_DEVOPS_TEAM`. Se vazio, o BFF lista times do
projeto e escolhe o de mesmo nome, `{projeto} Team` ou o primeiro.

Rotas implementadas:

| Método | Caminho | Azure DevOps |
| --- | --- | --- |
| GET | `/me` | connectionData + profile |
| GET | `/sprint/current` | team iterations `timeframe=current` |
| GET | `/sprints` | team iterations |
| GET | `/work-items` | WIQL + work items `$expand=all` |
| GET | `/work-items/:id` | work item `$expand=all` |
| GET | `/pipelines` | builds `requestedFor` + `$top=50` |
| GET | `/metrics` | WIQL + builds + PRs + VDM |
| GET | `/deploy-cards?sprintId=` | itens da Sprint (mesmo escopo do Modo Lead) |
| POST | `/deploy-cards` | work item JSON Patch |
| POST | `/deploy-cards/:id/tasks` | anexa tarefas, atualiza descrição e fecha |

### Enriquecimento de work items

Depois do GET por ids, `enrichWorkItems` (handlers):

1. **Bugs relacionados** — relations (exceto
   `Hierarchy-Reverse` e `TestedBy`); busca os ids e guarda os do
   tipo Bug.
2. **PRs** — artifacts `vstfs:///Git/PullRequestId/...` em
   `pullRequests.ts`. Para cada PR único:
   - `deployed` se status active/completed e target `main`/`master`
   - `releasePrCreated` se target `release` ou `release/*`

O mapper `mapAzureWorkItem` normaliza campos Azure → `WorkItem`
(tipo, assignee, story points de StoryPoints ou Effort, blocked por
campo CMMI ou tag, HTML da descrição virando texto).

## 3. Tasks

Arquivos principais: `Dashboard.tsx`, `SprintSummary`,
`SprintMultiSelect`, `WorkItemBoard`, `WorkItemRow`,
`WorkItemDetails`, `useWorkItems`, `useDashboardFilters`.

### Sprint atual e multi-select

- Sprint atual: `GET /sprint/current`.
- Lista: `GET /sprints`. `mergeSprints` junta as duas e evita
  duplicata.
- Sem seleção explícita, o Dashboard usa a sprint atual.
- `SprintMultiSelect` é um `<details>` com checkboxes. Não dá para
  desmarcar a última sprint. Há busca local por nome
  (`Buscar sprint`) e o botão “Manter só a primeira”.
- O menu é `position: absolute` com `overflow: visible` no Card
  para não ser recortado.

A query de work items aceita vários `sprintId`. A WIQL
(`buildSprintWorkItemsQuery`) faz:

```text
[System.TeamProject] = @project
AND (IterationPath UNDER 'A' OR IterationPath UNDER 'B')
AND [System.AssignedTo] = @Me   -- omitido no Lead Mode
```

Se o id não contém `\` ou `/`, cai em `@CurrentIteration`.

`useWorkItems` só dispara quando há sprint **e** (`userId` ou
Lead Mode). `placeholderData: keepPreviousData` evita flicker ao
trocar sprint.

### Filtros, busca e ordenação (só cliente)

`useDashboardFilters` não refaz request. Aplica, nesta ordem:

1. tipo (`Task`, `Bug`, `User Story`, …)
2. estado
3. coluna do board
4. desenvolvedores (Lead Mode)
5. busca em título, id, tipo e estado
6. sort: id, title, type, state, priority, updatedAt (`pt-BR`)

Colunas, estados e desenvolvedores do `<Select>` vêm dos itens já
carregados.

### Pontos e contagem de cards

- Pontos: `sumAssignedStoryPoints` soma `storyPoints` dos itens
  atribuídos ao usuário do PAT (id, e-mail ou displayName).
- Cards puxados / fechados: `countAssignedSprintCards`.
  Puxado = atribuído e coluna ≠ `Ag Desenvolvimento`
  (normalização sem acento). Fechado = estado resolvido
  (`resolveBugStatus.isResolvedWorkItemState`).

### Coluna do board e bugs

`resolveBoardStatus` mapeia a coluna (texto normalizado) para
blocked / done / deploy / qa / doing / development / default.
Usado pelo `BoardStatus` visual.

`resolveBugStatus`:

- no próprio Bug: open ou fixed pelo estado
- em Task/Story: olha `relatedBugs` e bugs do catálogo ligados
  por `relatedIds`

### Detalhes

Clique na linha → `selectedId` → `useWorkItemDetails` →
`GET /work-items/:id`. Painel lateral (`WorkItemDetails`) com
loading/erro/retry independentes do board.

## 4. Lead Mode

Flag booleana persistida. Quando liga:

- WIQL **não** filtra `@Me` — vem a sprint inteira.
- A tabela mostra a coluna Responsável.
- Aparece `DeveloperMultiSelect` (OR de vários nomes). Itens
  já marcados **não** são limpos ao mudar esse filtro.
- Seleção de linhas (`selectedWorkItemIds`) habilita três ações.
- Coluna **Criado em** na tabela (`System.CreatedDate`).

### Pedido de PR

`PrRequestDialog` + `buildPrRequestMessage`: texto em português
com id, título, responsável e URL. Só faz sentido com tarefas de
um único desenvolvedor (a UI restringe o caso). Copia para a
área de transferência.

### Criar cartão de deploy

Arquivos: `DeployCardDialog`, `useCreateDeployCard`,
`buildDeployCardDescription`.

1. UI monta a descrição com `buildDeployCardDescription`:
   - **Aplicações afetadas**: repo/projeto deduplicados das PRs
     **concluídas** (`status === completed`) ligadas às tarefas
     selecionadas (qualquer branch de destino).
   - **Pull Requests**: mesmas PRs, agrupadas por repo/projeto;
     rótulo com branch e id (`(branch) (!id)`).
   - **Histórias/Funcionalidades**: itens relacionados + selecionados.
2. `useCreateDeployCard` → POST `/api/azure-devops/deploy-cards`.
3. BFF cria work item do tipo
   `AZURE_DEVOPS_DEPLOY_WORK_ITEM_TYPE` (padrão `Task`) via
   JSON Patch: Title, Description (markdown → HTML), IterationPath
   (tarefa ou sprint atual) e relations `System.LinkTypes.Related`.

PRs vêm do enriquecimento do board (`withDeployment` + artifact
links no work item). Sem PR vinculada no Azure, a seção de
aplicações fica vazia.

### Adicionar tarefas a um cartão de deploy

Arquivos: `AddToDeployCardDialog`, `useDeployCards`,
`useAttachTasksToDeployCard`, `deployCardUnifiedWorkItems`.

1. `useDeployCards` → GET `/deploy-cards?sprintId=…` — mesma WIQL
   da sprint inteira no Lead Mode (qualquer tipo/estado de item).
2. Dialog: select do cartão alvo + preview da descrição unificada
   (`relatedIds` do cartão + tarefas selecionadas →
   `buildDeployCardDescription`).
3. POST `/deploy-cards/:id/tasks` com `{ description, workItemIds }`.
4. BFF: PATCH descrição HTML, relations Related novas, PATCH
   `System.State = Closed` em cada tarefa anexada.

Lista e anexação recarregam ao abrir o dialog e após criar cartão.
Providers: `rest` (Azure), `mock` (memória), `mcp` (não persiste).

## 5. Anotações (To Do's)

100% local. Sem Azure.

- Storage: `portal-todos` (`todosStorage.ts`).
- Shape: `{ id, text, color, createdAt }`. `id` = `crypto.randomUUID()`.
- Cor cicla 0–3. Inclinação visual = hash do id (`noteTilt`).
- `writeTodos` dispara `portal-todos-changed` para o badge do
  Header (`useTodoCount`) atualizar sem prop drilling.
- CRUD em `TodosBoard` / `useTodos`.

## 6. Pipelines

BFF: `GET /{pipelineProject}/_apis/build/builds` com

- `requestedFor` = id / uniqueName / e-mail do PAT
- `statusFilter=all`, `queryOrder=queueTimeDescending`, `$top=50`
- `definitions` se `AZURE_DEVOPS_PIPELINE_DEFINITION_IDS` existir

`pipelineProject` = `AZURE_DEVOPS_PIPELINE_PROJECT` ou o projeto
dos work items.

O cliente parseia em `pipelineParsers.ts` (nome, número, status,
resultado, branch, horário, URL).

`usePipelines` refaz a query a cada 30s
(`refetchIntervalInBackground: true`).

## 7. Metrics (somente leitura)

Não raspa dashboards nativos e não inventa KPI. Fontes: as mesmas
APIs REST do restante do portal.

### Query no BFF (`loadMetrics`)

1. Valida `scope` (`personal` | `team` | `project`) e `period`
   (`current-sprint` | `7-days` | `30-days` | `90-days`).
2. WIQL sempre com `[System.TeamProject] = @project`.
3. Sprint atual: mesma cláusula de iteração; personal adiciona
   `@Me`.
4. 7/30/90 dias (UTC, início = meia-noite de hoje − N):
   - itens com `ChangedDate` no período e estado ≠ Removed
   - **ou** `ClosedDate` no período
   - personal: `AssignedTo = @Me`
5. Ids únicos; aviso se WIQL estourar 20.000.
6. Work items em lotes de 200, só com
   `METRICS_WORK_ITEM_FIELDS` (sem expand de relations/PRs).
7. Personal: PRs `searchCriteria.creatorId={id}` (`$top=200`) e
   as mesmas builds da aba Pipelines. Falha vira
   `error` / `unavailable`, nunca zero silencioso.
8. VDM: WIQL `@Me` + `ClosedDate >=` início do mês UTC,
   independente do período da tela.

### Cálculo no cliente

`parseMetricsDashboard` → `calculateMetrics` /
`buildMetricsDashboard`.

Contagens **atuais** (atribuídos, ativos, bugs, sem responsável)
vs **do período** (concluídos). Um item atribuído só conta como
concluído se o estado casa com resolvido/fechado/pronto.

KPI overdue só existe se `Microsoft.VSTS.Scheduling.DueDate` for
data válida e o item ainda estiver ativo.

VDM Objective: `VITE_AZURE_DEVOPS_VDM_OBJECTIVE` (padrão 7) +
`vdmClosedInMonth` do servidor.

Clique num KPI filtra a tabela (`filterMetricItems`). Analytics /
tendências históricas não entram.

No MCP, metrics são derivadas dos work items já obtidos pelo
transporte, sem o recorte WIQL do BFF.

## 8. Tema e Header

- Tema: `document.documentElement.dataset.theme` + overrides em
  `global.css` para tabs/tags no escuro.
- Header: tabs Tamentai (`tasks` / `todos` / `pipelines` /
  `metrics`), Lead Mode, toggle de tema, avatar do usuário do
  PAT. Sem login/logout na UI.

## 9. Providers mock e MCP

**Mock** (`mockData.ts` + `mockService.ts`): usuário, sprints,
itens, pipelines e metrics fixos. Delay configurável para
esqueleto/loading.

**MCP:** HTTP POST no `VITE_AZURE_DEVOPS_MCP_URL` com o nome da
tool (`transport.ts`). Tools padrão:
`get_current_user`, `get_user_pipelines`, `get_current_sprint`,
`get_sprints`, `get_user_work_items`, `get_work_item_details`.
`createDeployCard` não persiste. Metrics são montadas no cliente
a partir desses tools.

## 10. Mapa rápido UI → hook → serviço → BFF

```text
Header / Dashboard view          WorkspaceViewProvider (memória)
Tema                             ThemeProvider → localStorage
Lead Mode                        LeadModeProvider → localStorage
To Do's                          useTodos → localStorage
Usuário                          useCurrentUser → GET /me
Sprint atual / lista             useCurrentSprint / useSprints
Work items                       useWorkItems → GET /work-items
Detalhes                         useWorkItemDetails → GET /work-items/:id
Pipelines                        usePipelines (30s) → GET /pipelines
Metrics                          useMetrics → GET /metrics
Deploy card                      useCreateDeployCard → POST /deploy-cards
Anexar ao deploy                 useAttachTasksToDeployCard → POST /deploy-cards/:id/tasks
Listar deploys                   useDeployCards → GET /deploy-cards
Filtros / busca / sort           useDashboardFilters (cliente)
```
