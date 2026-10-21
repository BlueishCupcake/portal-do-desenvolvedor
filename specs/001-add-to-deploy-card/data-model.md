# Data Model: Adicionar tarefas a um card de deploy

## DeployCardSummary

Representação mínima para seleção no dialog.

| Field | Type | Rules |
|-------|------|--------|
| `id` | `number` | Azure work item id |
| `title` | `string` | `System.Title` |
| `url` | `string` | Link `_workitems/edit/{id}` |
| `state` | `string` | Não concluído para aparecer na lista |
| `iterationPath` | `string?` | Deve coincidir com Sprint atual quando filtrado |

**Source**: WIQL / GET deploy-cards.

## AttachTasksToDeployCardInput

| Field | Type | Rules |
|-------|------|--------|
| `deployCardId` | `number` | Cartão alvo existente |
| `workItemIds` | `number[]` | ≥1; deduplicado; tarefas selecionadas no Lead Mode |

## AttachTasksToDeployCardResult

| Field | Type | Rules |
|-------|------|--------|
| `deployCard` | `DeployCard` | id, title, url após update |
| `attachedWorkItemIds` | `number[]` | Ids que receberam relation nova nesta operação |
| `closedWorkItemIds` | `number[]` | Ids cujo estado foi definido para `Closed` |

## DeployCard (existente — `src/types/deployCard.ts`)

Mantido para create; summary pode reutilizar os mesmos campos id/title/url.

## WorkItem (existente — `src/types/workItem.ts`)

Usado como entrada de `buildDeployCardDescription`. Para anexação, o BFF
precisa de work items enriquecidos (PRs, relatedIds) para ids unificados.

## Relationships

```text
DeployCard (1) --[System.LinkTypes.Related]--> (*) Task/WorkItem
```

Descrição do DeployCard é derivada (não entidade separada): texto gerado a
partir do conjunto de work items ligados + catálogo.

## State transitions

| Entity | From | To | Trigger |
|--------|------|-----|---------|
| Tarefa selecionada | qualquer estado aberto | `Closed` | POST attach bem-sucedido |
| Tarefa já `Closed` | `Closed` | `Closed` | PATCH no-op (aceitável) |
| Deploy card | aberto | aberto | descrição/relations atualizadas |

## Validation rules

- FR: ao menos uma tarefa e um cartão selecionado antes de confirmar.
- Cartão fechado não aparece na lista (WIQL).
- Ids inválidos ou cartão inexistente → 400 com mensagem PT.
- `workItemIds` que já possuem relation Related com o cartão: não duplicar
  relation; incluir na regeneração da descrição.
