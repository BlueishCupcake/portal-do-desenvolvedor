# BFF Contract: Deploy cards (list + attach)

Base path: `/api/azure-devops` (proxy Vite → `handleAzureDevOpsApi`).

Autenticação: PAT no servidor (`AZURE_DEVOPS_PAT`). Respostas de erro em
português (`{ message: string }`).

## GET `/deploy-cards`

Lista cartões de deploy elegíveis para anexação.

### Query parameters

| Name | Required | Description |
|------|----------|-------------|
| `sprintId` | yes* | Guid da iteracao (mesmo id usado em `/sprint/work-items`) |
| `iterationPath` | yes* | Alternativa explícita ao path da iteracao |

\* Exatamente um de `sprintId` ou `iterationPath` deve ser resolvível para a
Sprint atual do Modo Lead.

### Response `200`

```json
{
  "value": [
    {
      "id": 120000,
      "title": "Deploy Sprint 42",
      "url": "https://dev.azure.com/{org}/{project}/_workitems/edit/120000",
      "state": "New",
      "iterationPath": "Project\\Sprint 42"
    }
  ]
}
```

### Errors

| Status | When |
|--------|------|
| 503 | PAT/org/project ausentes |
| 400 | Parâmetros inválidos |
| 502/500 | Falha Azure (mensagem genérica PT) |

### WIQL (implementação)

Filtro sugerido:

- `[System.TeamProject] = @project`
- `[System.WorkItemType] = @deployWorkItemType`
- `[System.IterationPath] = @iterationPath`
- `[System.State] NOT IN ('Closed','Done','Removed')` (ajustar ao template do
  projeto se necessário)

---

## POST `/deploy-cards` (existente)

Sem alteração de contrato. Ver FEATURES.md.

---

## POST `/deploy-cards/:deployCardId/tasks`

Anexa tarefas a um cartão existente e fecha as tarefas.

### Path

- `deployCardId`: integer (work item id do cartão)

### Request body

```json
{
  "workItemIds": [61407, 61408]
}
```

| Field | Type | Validation |
|-------|------|------------|
| `workItemIds` | `number[]` | ≥1, inteiros, deduplicados |

### Response `200`

```json
{
  "id": 120000,
  "title": "Deploy Sprint 42",
  "url": "https://dev.azure.com/contoso/portal/_workitems/edit/120000",
  "attachedWorkItemIds": [61408],
  "closedWorkItemIds": [61407, 61408]
}
```

Campos extras opcionais para UI; mínimo exigido: `id`, `title`, `url` (tipo
`DeployCard`).

### Server behavior (normative)

1. GET work item `deployCardId` com `$expand=Relations`.
2. Coletar ids Related existentes + `workItemIds`.
3. Carregar work items enriquecidos (mesmos campos/PRs que Sprint).
4. `description = buildDeployCardDescription(unifiedItems, catalog)`.
5. PATCH cartão: `System.Description` = HTML(`description`); add relations
   para ids novos.
6. PATCH cada id em `workItemIds`: `System.State` = `Closed`.

### Errors

| Status | When |
|--------|------|
| 400 | Body inválido, cartão fechado, ids inválidos |
| 404 | Cartão não encontrado |
| 405 | Método não permitido (guard global) |
| 503 | Config ausente |

---

## HTTP method guard (change)

`handleAzureDevOpsApi` MUST allow:

- `GET` (rotas existentes + `/deploy-cards`)
- `POST` `/deploy-cards` (create)
- `POST` `/deploy-cards/:id/tasks` (attach)
