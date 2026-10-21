# UI Contract: Modo Lead — Adicionar tarefas a um card de deploy

## Entry point

**Location**: `WorkItemBoard` — barra de ações Lead (`leadMode && selectedItems.length > 0`).

**Control**: `Button` primário, label **"Adicionar tarefas a um card de deploy"**.

**Visibility**: Mesma condição que "Criar cartão de deploy" (≥1 tarefa selecionada).
Independente de `sameAssignee` (diferente de "Solicitar criação de PR").

## Dialog: `AddToDeployCardDialog`

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controle de visibilidade |
| `workItems` | `WorkItem[]` | Tarefas selecionadas na grade |
| `catalog` | `WorkItem[]` | Catálogo Sprint (para descrição) |
| `sprintId` | `string` | Carregar lista de cartões |
| `onAttach` | `(input) => Promise<DeployCard>` | Mutation attach |
| `onLoadDeployCards` | `() => Promise<DeployCardSummary[]>` | Lista elegível |
| `onClose` | `() => void` | Cancelar / concluir |
| `onAttached` | `() => void` | Invalidar/refetch work items após sucesso |

### Estados

1. **Loading**: carregando cartões.
2. **Empty**: nenhum cartão — texto explicativo, confirmar desabilitado.
3. **Ready**: select de cartão + preview descrição (`buildDeployCardDescription`
   sobre união simulada: tarefas selecionadas + ids já no cartão se expostos
   pelo GET detalhe opcional, ou preview só das selecionadas até escolher
   cartão — implementação pode buscar detalhe ao selecionar).
4. **Submitting**: botão "Adicionando...".
5. **Success**: link para cartão (mesmo padrão `DeployCardDialog`).
6. **Error**: `role="alert"` mensagem PT.

### Ações footer

- Cancelar / Concluir (outline secondary)
- Confirmar: **"Adicionar ao cartão"** (primary, disabled sem cartão ou em loading)

### Acessibilidade

- `aria-label` no dialog em PT
- Labels associados ao seletor de cartão

## Service interface (`AzureDevOpsService`)

Estender `src/services/azureDevOps/types.ts`:

```typescript
listDeployCards(query: { sprintId: string }): Promise<DeployCardSummary[]>;
attachTasksToDeployCard(
  deployCardId: number,
  input: { workItemIds: number[] },
): Promise<DeployCard>;
```

Implementações: `restService`, `mockService`, `mcpService` (erro/no-op).

## Dashboard wiring

`Dashboard.tsx` passa callbacks para `WorkItemBoard`, análogo a
`onCreateDeployCard`:

- `useDeployCards(sprintId)`
- `useAttachTasksToDeployCard()` com invalidação de query de work items da
  Sprint após sucesso.

## Copy (PT-BR)

| Key | Text |
|-----|------|
| Dialog title | Adicionar tarefas a um card de deploy |
| Confirm | Adicionar ao cartão |
| Submitting | Adicionando... |
| Success | Tarefas adicionadas ao cartão de deploy com sucesso. |
| Empty list | Nenhum cartão de deploy aberto nesta Sprint. |
| Error generic | Não foi possível adicionar as tarefas ao cartão de deploy. |
