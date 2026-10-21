# Research: Adicionar tarefas a um card de deploy

## 1. Listar cartões de deploy elegíveis

**Decision**: Expor `GET /api/azure-devops/deploy-cards?sprintId={id}` (ou
`iterationPath` derivado da Sprint atual) que executa WIQL no BFF filtrando
work items onde `[System.WorkItemType]` = `deployWorkItemType`,
`[System.IterationPath]` = iteracao da Sprint e `[System.State]` não está em
estados concluídos (`Closed`, `Done`, `Removed` — alinhado a
`isCompletedWorkItemState` / `isResolvedWorkItemState` já usados no cliente).

**Rationale**: Não existe endpoint hoje além de `POST /deploy-cards`. WIQL é o
mesmo padrão usado para métricas e carga de Sprint no `handlers.ts`. Filtrar
por iteracao evita misturar deploys de sprints antigas.

**Alternatives considered**:

- Listar todos os Tasks do projeto: muito ruído; rejeitado.
- Identificar deploy só por título: frágil; rejeitado.
- Cliente montar lista a partir do catálogo da Sprint: cartões podem não estar
  atribuídos a ninguém visível na grade; rejeitado como única fonte.

## 2. Atualizar descrição mantendo padrões existentes

**Decision**: Regenerar a descrição inteira com `buildDeployCardDescription`
sobre o conjunto unificado de work items: ids já ligados ao cartão (relations
Related existentes) ∪ ids novos selecionados. Buscar detalhes/PRs desses ids
via BFF (reutilizar enriquecimento já feito para Sprint ou batch
`workitems?ids=` + passo de PRs se necessário).

**Rationale**: A função já define o contrato de conteúdo (seções, links,
rótulos PT). Mesclar texto HTML/markdown manualmente duplicaria lógica e
quebraria previews.

**Alternatives considered**:

- Append-only das linhas novas ao final da descrição: diverge do padrão quando
  PRs/apps se repetem; rejeitado.
- Editar só relations sem descrição: não atende requisito de seguir padrão do
  card; rejeitado.

## 3. Persistência no Azure (anexar + fechar)

**Decision**: Novo handler `POST /api/azure-devops/deploy-cards/:id/tasks` com
corpo `{ workItemIds: number[] }` que, em ordem:

1. Valida ids e cartão existente.
2. Lê relations atuais; calcula ids novos.
3. PATCH JSON no work item do cartão: `System.Description` (HTML via
   `descriptionToHtml`) e `relations/-` para cada id novo.
4. PATCH cada tarefa selecionada: `System.State` = `Closed`.

Transação lógica: se fechamento falhar após PATCH do cartão, retornar erro
explícito (cartão pode ficar parcialmente atualizado — documentar no quickstart;
opcional futuro: compensação).

**Rationale**: Espelha `createDeployCard` (JSON Patch + Related links +
descrição HTML). Azure DevOps não oferece transação multi-item.

**Alternatives considered**:

- Um único PATCH no cartão sem fechar tarefas: viola FR-005; rejeitado.
- Fechar tarefas no cliente: expõe PAT e lógica; rejeitado (BFF obrigatório).

## 4. UI / UX Lead Mode

**Decision**: Terceiro botão ao lado de "Criar cartão de deploy", mesma
condição `selectedItems.length > 0`. Novo `AddToDeployCardDialog` (Tamentai
`Dialog`, padrão de `DeployCardDialog`): combobox/lista de cartões, lista
somente leitura das tarefas selecionadas, preview da descrição consolidada,
hook `useAttachTasksToDeployCard` + `useDeployCards` (React Query).

**Rationale**: Consistência visual e de fluxo com ações Lead existentes em
`WorkItemBoard.tsx`.

**Alternatives considered**:

- Reutilizar `DeployCardDialog` com modo: aumenta complexidade de um componente
  já focado em criação; rejeitado.

## 5. Providers mock / mcp / rest

**Decision**:

- `rest`: chama novos endpoints BFF.
- `mock`: mantém array de cartões simulados; anexação atualiza descrição e
  marca tarefas `Closed` em memória.
- `mcp`: rejeitar ou no-op com mensagem, igual `createDeployCard`.

**Rationale**: Paridade com FEATURES.md § Create deploy card.

**Alternatives considered**: Implementar só rest — quebra desenvolvimento local;
rejeitado.

## 6. Permissões HTTP no BFF

**Decision**: Estender `handleAzureDevOpsApi` para aceitar `GET` em
`/deploy-cards` e `POST` em `/deploy-cards/:id/tasks` (além do POST create
existente).

**Rationale**: Hoje o guard retorna 405 para qualquer método != GET exceto POST
create; novos verbos precisam de exceção explícita.

**Alternatives considered**: PUT/PATCH no cartão pelo cliente direto — viola
arquitetura BFF; rejeitado.
